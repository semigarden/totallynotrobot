import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
    createPlantBillboard,
    createPlantNameLabel,
    createPlantTitleLabel,
} from "@/utils/plantBillboard";
import { createPlantAtlasBillboards } from "@/utils/plantAtlasBillboard";
import { initPlantSway, updatePlantSway } from "@/utils/plantMotion";
import {
    buildFlowerPosition,
    createFlowerBillboard,
    flowerCountForLine,
} from "@/utils/flowerBillboard";
import { createGrassField } from "@/utils/grassField";
import {
    attachGardenWalkControls,
    attachScrollWalk,
} from "@/utils/gardenNavigation";
import {
    DEFAULT_VISIBLE_CHUNK_RADIUS,
    clampPointToBounds,
    computeAuthoredBounds,
    groupPlantsByChunk,
    visibleChunkKeys,
} from "@/utils/gardenChunks";
import { createMoon } from "@/utils/moonScene";
import { createGardenComposer } from "@/utils/gardenPostProcessing";
import {
    createGardenRenderer,
    gardenPixelRatio,
    setGardenTextureRenderer,
} from "@/utils/gardenRenderer";
import { createGroundRipples } from "@/utils/groundRipples";
import { createDateTerritories } from "@/utils/dateTerritories";
import {
    createWalkPositionSaver,
    loadWalkPosition,
} from "@/api/gardenPosition";

const FLOWERS_ENABLED = false;
// Temporary: hide post titles, author names, and year labels in-scene.
const TEMPORARILY_HIDE_SCENE_METADATA = true;

const disposeObject = (object) => {
    const disposeMaterial = (material) => {
        if (material.map) material.map.dispose();
        Object.values(material.uniforms ?? {}).forEach((uniform) => {
            if (uniform?.value?.isTexture) uniform.value.dispose();
        });
        material.dispose();
    };

    object.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
            if (Array.isArray(node.material)) {
                node.material.forEach(disposeMaterial);
            } else {
                disposeMaterial(node.material);
            }
        }
    });
};

const normalizePlants = (plants) =>
    Array.isArray(plants) ? plants.filter((plant) => plant?.text) : [];

const plantPosition = (plant) => ({
    x: Number.isFinite(plant?.x) ? plant.x : 0,
    z: Number.isFinite(plant?.z) ? plant.z : 0,
});

const createChunkContent = ({
    plants,
    showPlantTitles = true,
}) => {
    const gardenPlants = normalizePlants(plants);
    const group = new THREE.Group();
    const plantGroup = new THREE.Group();
    const positions = gardenPlants.map(plantPosition);

    if (!showPlantTitles) {
        plantGroup.add(createPlantAtlasBillboards(gardenPlants));
        group.add(plantGroup);
    } else {
    gardenPlants.forEach((plant) => {
        const billboard = createPlantBillboard(plant.text, plant.id, {
            gardenId: plant.gardenId,
            pubDate: plant.pubDate,
            at: plant.at,
        });
        const position = plantPosition(plant);
        billboard.position.set(position.x, 0, position.z);
        initPlantSway(billboard, plant.id ?? plant.text);

        if (showPlantTitles && !TEMPORARILY_HIDE_SCENE_METADATA) {
            const label = createPlantTitleLabel(
                plant.blogTitle ?? plant.title,
                plant.id ?? plant.text,
                plant.pubDate ?? plant.at
            );

            if (label) {
                label.position.set(position.x, billboard.scale.y + 0.28, position.z);
                billboard.userData.titleLabel = label;
                plantGroup.add(label);
            }

            const nameLabel = createPlantNameLabel(
                plant.gardenName,
                plant.gardenId ?? plant.id ?? plant.text
            );

            if (nameLabel) {
                nameLabel.position.set(position.x, 0.18, position.z);
                billboard.userData.nameLabel = nameLabel;
                plantGroup.add(nameLabel);
            }
        }

        plantGroup.add(billboard);
    });

    group.add(plantGroup);
    }

    if (FLOWERS_ENABLED) {
        const flowerGroup = new THREE.Group();
        gardenPlants.forEach((plant, index) => {
            const anchor = positions[index] ?? { x: 0, z: 0 };
            const flowerTotal = flowerCountForLine(plant.text, plant.id);

            for (let flowerIndex = 0; flowerIndex < flowerTotal; flowerIndex++) {
                const flowerPosition = buildFlowerPosition(
                    plant,
                    anchor,
                    flowerIndex
                );
                const flower = createFlowerBillboard(
                    plant.text,
                    `${plant.id}:${flowerIndex}`,
                    flowerPosition.scale
                );
                flower.position.set(flowerPosition.x, 0, flowerPosition.z);
                flowerGroup.add(flower);
            }
        });
        group.add(flowerGroup);
    }

    const grass = createGrassField(gardenPlants, positions, {
        includeBaseGrass: false,
    });
    grass.position.y = 0.02;
    group.add(grass);

    return group;
};

const syncGardenChunks = ({
    plantRoot,
    loadedChunks,
    plants,
    cameraPosition,
    chunkRadius = DEFAULT_VISIBLE_CHUNK_RADIUS,
    showPlantTitles = true,
}) => {
    if (!plantRoot) return;

    const chunks = groupPlantsByChunk(plants);
    const visibleKeys = visibleChunkKeys(cameraPosition, chunkRadius);
    const desiredKeys = new Set(
        [...visibleKeys].filter((key) => chunks.has(key))
    );

    loadedChunks.forEach((chunk, key) => {
        if (desiredKeys.has(key)) return;

        plantRoot.remove(chunk.group);
        disposeObject(chunk.group);
        loadedChunks.delete(key);
    });

    desiredKeys.forEach((key) => {
        const chunkPlants = chunks.get(key) ?? [];
        const existing = loadedChunks.get(key);
        const showLabels =
            showPlantTitles && !TEMPORARILY_HIDE_SCENE_METADATA;
        const plantIds = `${showLabels ? "t" : "n"}:${chunkPlants
            .map((plant) => plant.id)
            .join("|")}`;

        if (existing?.plantIds === plantIds) return;

        if (existing) {
            plantRoot.remove(existing.group);
            disposeObject(existing.group);
            loadedChunks.delete(key);
        }

        const group = createChunkContent({
            plants: chunkPlants,
            showPlantTitles: showLabels,
        });
        plantRoot.add(group);
        loadedChunks.set(key, { group, plantIds });
    });
};

const syncDateTerritories = ({ scene, territoryRef, plants, enabled }) => {
    if (!scene || !territoryRef) return;

    if (territoryRef.current) {
        scene.remove(territoryRef.current);
        disposeObject(territoryRef.current);
        territoryRef.current = null;
    }

    if (!enabled) return;

    const nextTerritories = createDateTerritories(plants, {
        showLabels: !TEMPORARILY_HIDE_SCENE_METADATA,
    });
    scene.add(nextTerritories);
    territoryRef.current = nextTerritories;
};

const GardenScene = ({
    plants = [],
    className,
    canvasClassName,
    interactive = true,
    cameraOffset = { x: 0, y: 7, z: 11 },
    cameraTarget = { x: 0, y: 2.5, z: 0 },
    minDistance = 3,
    maxDistance = 32,
    scrollWalk = true,
    walkSpeed = 0.004,
    walkNavigation = false,
    walkPositionKey = "immersive",
    showPlantTitles = true,
    showDateTerritories = false,
    onWalkStateChange = null,
    postProcessingPreset = null,
    postProcessingRef = null,
}) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const plantRootRef = useRef(null);
    const territoryRef = useRef(null);
    const loadedChunksRef = useRef(new Map());
    const movementBoundsRef = useRef(computeAuthoredBounds(plants));
    const plantsRef = useRef(plants);
    const showPlantTitlesRef = useRef(showPlantTitles);
    const showDateTerritoriesRef = useRef(showDateTerritories);

    plantsRef.current = plants;
    showPlantTitlesRef.current = showPlantTitles;
    showDateTerritoriesRef.current = showDateTerritories;
    movementBoundsRef.current = computeAuthoredBounds(plants);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        let cancelled = false;
        let cleanup = () => {};

        const setupScene = async () => {
        const savedPosition = walkNavigation
            ? await loadWalkPosition(walkPositionKey)
            : null;
        if (cancelled) return;

        const positionSaver = walkNavigation
            ? createWalkPositionSaver(450, walkPositionKey)
            : null;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000100);
        scene.fog = new THREE.Fog(0x000100, 32, 80);

        const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
        camera.position.set(cameraOffset.x, cameraOffset.y, cameraOffset.z);
        cameraRef.current = camera;

        const renderer = createGardenRenderer();
        renderer.setPixelRatio(gardenPixelRatio());
        setGardenTextureRenderer(renderer);
        mount.appendChild(renderer.domElement);

        const postProcessing = createGardenComposer(
            renderer,
            scene,
            camera,
            postProcessingPreset ?? undefined
        );
        if (postProcessingRef) {
            postProcessingRef.current = postProcessing.effects;
        }

        let controls = null;
        let walkControls = null;
        let detachScrollWalk = null;
        const constrainPosition = (state) =>
            clampPointToBounds(state, movementBoundsRef.current);
        const handleWalkPositionChange = (state) => {
            positionSaver?.schedule(state);
            onWalkStateChange?.(state);
        };

        if (walkNavigation) {
            walkControls = attachGardenWalkControls({
                camera,
                domElement: renderer.domElement,
                cameraY: cameraOffset.y,
                initialOffset: cameraOffset,
                lookTarget: cameraTarget,
                savedState: savedPosition,
                onPositionChange: handleWalkPositionChange,
                constrainPosition,
                enabled: interactive,
                pinchSpeed: walkSpeed * 3.5,
            });

            if (scrollWalk) {
                detachScrollWalk = attachScrollWalk({
                    camera,
                    domElement: renderer.domElement,
                    speed: walkSpeed,
                    onMove: (move) => {
                        walkControls.cancelMoveTarget?.();
                        const state = walkControls.getState();
                        state.x += move.x;
                        state.z += move.z;
                        constrainPosition(state);
                        walkControls.applyCamera();
                    },
                });
            }
        } else {
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enabled = interactive;
            controls.enableDamping = true;
            controls.dampingFactor = 0.06;
            controls.rotateSpeed = -0.8;
            controls.enablePan = true;
            controls.screenSpacePanning = true;
            controls.minDistance = minDistance;
            controls.maxDistance = maxDistance;
            controls.enableZoom = !scrollWalk;
            controls.target.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);

            if (scrollWalk) {
                const target = controls.target;
                detachScrollWalk = attachScrollWalk({
                    camera,
                    domElement: renderer.domElement,
                    speed: walkSpeed,
                    onMove: (move) => {
                        camera.position.add(move);
                        target.add(move);

                        clampPointToBounds(camera.position, movementBoundsRef.current);
                        clampPointToBounds(target, movementBoundsRef.current);
                    },
                });
            }
        }

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(160, 160),
            new THREE.MeshBasicMaterial({ color: 0x070807 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        scene.add(ground);

        const groundRipples = createGroundRipples(scene);
        const moonRoot = createMoon(scene);

        sceneRef.current = scene;

        const plantRoot = new THREE.Group();
        scene.add(plantRoot);
        plantRootRef.current = plantRoot;

        syncGardenChunks({
            plantRoot,
            loadedChunks: loadedChunksRef.current,
            plants: normalizePlants(plantsRef.current),
            cameraPosition: camera.position,
            showPlantTitles: showPlantTitlesRef.current,
        });
        syncDateTerritories({
            scene,
            territoryRef,
            plants: normalizePlants(plantsRef.current),
            enabled: showDateTerritoriesRef.current,
        });

        const resize = () => {
            const width = mount.clientWidth;
            const height = mount.clientHeight;
            if (!width || !height) return;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
            postProcessing.resize(width, height);
        };

        const clock = new THREE.Clock();
        let frame = 0;
        const animate = () => {
            frame = requestAnimationFrame(animate);
            controls?.update();
            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();
            walkControls?.update(delta);
            ground.position.x = camera.position.x;
            ground.position.z = camera.position.z;
            syncGardenChunks({
                plantRoot,
                loadedChunks: loadedChunksRef.current,
                plants: normalizePlants(plantsRef.current),
                cameraPosition: camera.position,
                showPlantTitles: showPlantTitlesRef.current,
            });
            updatePlantSway(plantRoot, elapsed, camera);
            groundRipples.update(elapsed, camera);
            postProcessing.update(elapsed);
            postProcessing.composer.render();
        };
        animate();

        const resizeObserver = new ResizeObserver(() => resize());
        resizeObserver.observe(mount);
        requestAnimationFrame(() => resize());

        const onPageHide = () => {
            positionSaver?.flush();
        };

        window.addEventListener("pagehide", onPageHide);

        cleanup = () => {
            window.removeEventListener("pagehide", onPageHide);
            positionSaver?.flush();
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            detachScrollWalk?.();
            walkControls?.dispose();
            controls?.dispose();
            loadedChunksRef.current.forEach((chunk) => {
                plantRoot.remove(chunk.group);
                disposeObject(chunk.group);
            });
            loadedChunksRef.current.clear();
            if (territoryRef.current) {
                scene.remove(territoryRef.current);
                disposeObject(territoryRef.current);
                territoryRef.current = null;
            }
            groundRipples.dispose();
            scene.remove(moonRoot);
            disposeObject(moonRoot);
            disposeObject(scene);
            if (postProcessingRef) {
                postProcessingRef.current = null;
            }
            postProcessing.dispose();
            renderer.dispose();
            sceneRef.current = null;
            cameraRef.current = null;
            plantRootRef.current = null;
            setGardenTextureRenderer(null);
            if (mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement);
            }
        };
        };

        setupScene();

        return () => {
            cancelled = true;
            cleanup();
        };
    }, [
        interactive,
        scrollWalk,
        walkSpeed,
        walkNavigation,
        cameraOffset.x,
        cameraOffset.y,
        cameraOffset.z,
        cameraTarget.x,
        cameraTarget.y,
        cameraTarget.z,
        minDistance,
        maxDistance,
        walkPositionKey,
        showPlantTitles,
        showDateTerritories,
        onWalkStateChange,
        postProcessingPreset,
        postProcessingRef,
    ]);

    useEffect(() => {
        movementBoundsRef.current = computeAuthoredBounds(plants);
        syncGardenChunks({
            plantRoot: plantRootRef.current,
            loadedChunks: loadedChunksRef.current,
            plants: normalizePlants(plants),
            cameraPosition: cameraRef.current?.position ?? { x: 0, z: 0 },
            showPlantTitles,
        });
        syncDateTerritories({
            scene: sceneRef.current,
            territoryRef,
            plants: normalizePlants(plants),
            enabled: showDateTerritories,
        });
    }, [plants, showPlantTitles, showDateTerritories]);

    return (
        <div className={className}>
            <div ref={mountRef} className={canvasClassName} />
        </div>
    );
};

export default GardenScene;
