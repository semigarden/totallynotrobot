import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
    createPlantBillboard,
    createPlantNameLabel,
    createPlantTitleLabel,
} from "@/utils/plantBillboard";
import { createPlantAtlasBillboards } from "@/utils/plantAtlasBillboard";
import {
    createPlantScreenMotionTracker,
    initPlantSway,
    plantGrowFactor,
    plantShrinkFactor,
    splitCameraFollowPlants,
    syncCameraFollowPlants,
    updatePlantSway,
} from "@/utils/plantMotion";
import { effectiveGrowProgressForShrink } from "@/utils/plantGrowth";
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
    wrappedPointDelta,
    groupPlantsByChunk,
    visibleChunkKeys,
} from "@/utils/gardenChunks";
import { createImmersionClouds } from "@/utils/immersionClouds";
import { createImmersionEntrance } from "@/utils/immersionEntrance";
import { createMoon } from "@/utils/moonScene";
import { createGardenComposer } from "@/utils/gardenPostProcessing";
import {
    createGardenRenderer,
    gardenPixelRatio,
    setGardenTextureRenderer,
} from "@/utils/gardenRenderer";
import { createGroundRipples } from "@/utils/groundRipples";
import {
    computeOutermostTerritory,
    constrainTerritoryMovement,
    createDateTerritories,
} from "@/utils/dateTerritories";
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

const mergeShrinkingPlants = (plants, shrinkingPlants) => {
    const base = normalizePlants(plants);
    const baseIds = new Set(base.map((plant) => plant.id));
    const ghosts = [];

    shrinkingPlants.forEach((entry) => {
        const plant = entry.plant;
        if (plant?.id && !baseIds.has(plant.id)) {
            ghosts.push(plant);
        }
    });

    if (ghosts.length === 0) return base;

    return [...base, ...ghosts].sort((a, b) => a.id.localeCompare(b.id));
};

const computeMovementTerritory = (
    plants,
    wrapMovement,
    movementBounds = null
) => {
    if (movementBounds) {
        return { bounds: movementBounds, boundary: null };
    }

    const gardenPlants = normalizePlants(plants);
    if (wrapMovement) {
        return (
            computeOutermostTerritory(gardenPlants) ?? {
                bounds: computeAuthoredBounds(gardenPlants),
                boundary: null,
            }
        );
    }
    return {
        bounds: computeAuthoredBounds(gardenPlants),
        boundary: null,
    };
};

const isWalkPositionInBounds = (position, bounds) =>
    position &&
    bounds &&
    position.x >= bounds.minX &&
    position.x <= bounds.maxX &&
    position.z >= bounds.minZ &&
    position.z <= bounds.maxZ;

const plantPosition = (plant) => ({
    x: Number.isFinite(plant?.x) ? plant.x : 0,
    z: Number.isFinite(plant?.z) ? plant.z : 0,
});

const createChunkContent = ({
    plants,
    showPlantTitles = true,
    getInitialGrow = () => 1,
    plantScaleMultiplier = 1,
}) => {
    const gardenPlants = normalizePlants(plants);
    const group = new THREE.Group();
    const plantGroup = new THREE.Group();
    const positions = gardenPlants.map(plantPosition);

    if (!showPlantTitles) {
        plantGroup.add(
            createPlantAtlasBillboards(gardenPlants, {
                getInitialGrow,
                plantScaleMultiplier,
            })
        );
        group.add(plantGroup);
    } else {
    gardenPlants.forEach((plant) => {
        const globalProgress = getInitialGrow(plant);
        const billboard = createPlantBillboard(plant.text, plant.id, {
            gardenId: plant.gardenId,
            pubDate: plant.pubDate,
            at: plant.at,
            renderOptions: { globalProgress },
        });
        const position = plantPosition(plant);
        billboard.position.set(position.x, 0, position.z);
        billboard.userData.plantId = plant.id;
        billboard.userData.baseScale = billboard.scale.clone();
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
    getInitialGrow = () => 1,
    plantScaleMultiplier = 1,
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
        const plantIds = `${showLabels ? "t" : "n"}:${plantScaleMultiplier}:${chunkPlants
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
            getInitialGrow,
            plantScaleMultiplier,
        });
        plantRoot.add(group);
        loadedChunks.set(key, { group, plantIds });
    });
};

const syncFollowPlants = ({
    followRoot,
    followState,
    followPlants,
    showPlantTitles = true,
    getInitialGrow = () => 1,
    plantScaleMultiplier = 1,
}) => {
    if (!followRoot || !followState) return;

    const plantKey = `${plantScaleMultiplier}:${followPlants
        .map((plant) => `${plant.id}:${plant.text}`)
        .join("|")}`;

    if (followState.plantKey === plantKey && followState.group) return;

    if (followState.group) {
        followRoot.remove(followState.group);
        disposeObject(followState.group);
        followState.group = null;
    }

    followState.plantKey = plantKey;

    if (followPlants.length === 0) return;

    const group = createChunkContent({
        plants: followPlants,
        showPlantTitles,
        getInitialGrow,
        plantScaleMultiplier,
    });

    group.traverse((child) => {
        if (child.isMesh || child.isSprite) {
            child.renderOrder = 10000;
        }
    });

    followRoot.add(group);
    followState.group = group;
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
    freshSpawnLookTarget = null,
    minDistance = 3,
    maxDistance = 32,
    scrollWalk = true,
    walkSpeed = 0.004,
    walkNavigation = false,
    wrapMovement = false,
    walkPositionKey = "immersive",
    movementBounds = null,
    showPlantTitles = true,
    showDateTerritories = false,
    showClouds = false,
    showEntrance = false,
    moonPosition = null,
    moonLightTarget = null,
    cloudAnchor = null,
    cloudFollowCamera = true,
    plantScaleMultiplier = 1,
    visibleChunkRadius = DEFAULT_VISIBLE_CHUNK_RADIUS,
    onWalkStateChange = null,
    gardenActionsRef = null,
    postProcessingPreset = null,
    postProcessingRef = null,
}) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const plantRootRef = useRef(null);
    const followPlantRootRef = useRef(null);
    const followPlantStateRef = useRef({ plantKey: null, group: null });
    const territoryRef = useRef(null);
    const loadedChunksRef = useRef(new Map());
    const movementTerritoryRef = useRef(
        computeMovementTerritory(plants, wrapMovement, movementBounds)
    );
    const wasInsideTerritoryRef = useRef(null);
    const previousTerritoryPositionRef = useRef(null);
    const plantsRef = useRef(plants);
    const showPlantTitlesRef = useRef(showPlantTitles);
    const showDateTerritoriesRef = useRef(showDateTerritories);
    const plantScaleMultiplierRef = useRef(plantScaleMultiplier);
    const visibleChunkRadiusRef = useRef(visibleChunkRadius);
    const knownPlantIdsRef = useRef(new Set());
    const growingPlantsRef = useRef(new Map());
    const shrinkingPlantsRef = useRef(new Map());
    const plantMotionTrackerRef = useRef(createPlantScreenMotionTracker());
    const hasInitializedPlantsRef = useRef(false);

    const getPlantMotionFactor = (plant) => {
        const shrinking = shrinkingPlantsRef.current.get(plant.id);
        if (shrinking) {
            return effectiveGrowProgressForShrink(
                plantShrinkFactor(shrinking),
                shrinking.initialGrow
            );
        }

        const startedAt = growingPlantsRef.current.get(plant.id);
        return startedAt ? plantGrowFactor(startedAt) : 1;
    };

    const getInitialGrow = (plant) => getPlantMotionFactor(plant);

    const getRenderablePlants = () =>
        mergeShrinkingPlants(
            plantsRef.current,
            shrinkingPlantsRef.current
        );

    const getScenePlantSets = () => {
        const renderable = normalizePlants(getRenderablePlants());
        return splitCameraFollowPlants(renderable);
    };

    plantsRef.current = plants;
    showPlantTitlesRef.current = showPlantTitles;
    showDateTerritoriesRef.current = showDateTerritories;
    plantScaleMultiplierRef.current = plantScaleMultiplier;
    visibleChunkRadiusRef.current = visibleChunkRadius;
    movementTerritoryRef.current = computeMovementTerritory(
        plants,
        wrapMovement,
        movementBounds
    );

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        let cancelled = false;
        let cleanup = () => {};

        const setupScene = async () => {
        wasInsideTerritoryRef.current = null;
        previousTerritoryPositionRef.current = null;

        const loadedPosition = walkNavigation
            ? await loadWalkPosition(walkPositionKey)
            : null;
        const savedPosition =
            movementBounds &&
            loadedPosition &&
            !isWalkPositionInBounds(loadedPosition, movementBounds)
                ? null
                : loadedPosition;
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
        const constrainPosition = (state, motion = null) => {
            const territory = movementTerritoryRef.current;
            if (wrapMovement) {
                return constrainTerritoryMovement(
                    state,
                    territory,
                    wasInsideTerritoryRef,
                    previousTerritoryPositionRef,
                    motion
                );
            }
            clampPointToBounds(state, territory.bounds);
            return false;
        };
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
                lookTarget: freshSpawnLookTarget ?? cameraTarget,
                groundLookTarget: cameraTarget,
                savedState: savedPosition,
                onPositionChange: handleWalkPositionChange,
                constrainPosition,
                resolveMovementDelta: wrapMovement
                    ? (state, target) =>
                          wrappedPointDelta(
                              state,
                              target,
                              movementTerritoryRef.current.bounds
                          )
                    : null,
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
                        if (!walkControls.applyPositionConstraint?.()) {
                            walkControls.applyCamera();
                        }
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

                        clampPointToBounds(
                            camera.position,
                            movementTerritoryRef.current.bounds
                        );
                        clampPointToBounds(
                            target,
                            movementTerritoryRef.current.bounds
                        );
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
        const moonRoot = createMoon(scene, {
            position: moonPosition ?? undefined,
            lightTarget: moonLightTarget ?? undefined,
        });
        const clouds = showClouds
            ? createImmersionClouds(scene, {
                  anchor: cloudAnchor ?? undefined,
                  followCamera: cloudFollowCamera,
                  moonHeight: cloudAnchor?.y ?? moonPosition?.y ?? undefined,
                  minHeight: cloudAnchor ? 24 : 16,
                  maxHeight: cloudAnchor ? 46 : 34,
                  spreadX: cloudAnchor ? 76 : 58,
                  spreadZ: cloudAnchor ? 76 : 48,
                  layerCount: cloudAnchor ? 13 : 11,
              })
            : null;
        const entrance = showEntrance ? createImmersionEntrance(scene) : null;

        sceneRef.current = scene;

        const plantRoot = new THREE.Group();
        const followPlantRoot = new THREE.Group();
        scene.add(plantRoot);
        scene.add(followPlantRoot);
        plantRootRef.current = plantRoot;
        followPlantRootRef.current = followPlantRoot;

        const { worldPlants, followPlants } = getScenePlantSets();
        syncGardenChunks({
            plantRoot,
            loadedChunks: loadedChunksRef.current,
            plants: worldPlants,
            cameraPosition: camera.position,
            chunkRadius: visibleChunkRadiusRef.current,
            showPlantTitles: showPlantTitlesRef.current,
            getInitialGrow,
            plantScaleMultiplier: plantScaleMultiplierRef.current,
        });
        syncFollowPlants({
            followRoot: followPlantRoot,
            followState: followPlantStateRef.current,
            followPlants,
            showPlantTitles: showPlantTitlesRef.current,
            getInitialGrow,
            plantScaleMultiplier: plantScaleMultiplierRef.current,
        });
        syncCameraFollowPlants(followPlantRoot, camera, followPlants);
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
            const { worldPlants, followPlants } = getScenePlantSets();
            syncGardenChunks({
                plantRoot,
                loadedChunks: loadedChunksRef.current,
                plants: worldPlants,
                cameraPosition: camera.position,
                chunkRadius: visibleChunkRadiusRef.current,
                showPlantTitles: showPlantTitlesRef.current,
                getInitialGrow,
                plantScaleMultiplier: plantScaleMultiplierRef.current,
            });
            syncFollowPlants({
                followRoot: followPlantRootRef.current,
                followState: followPlantStateRef.current,
                followPlants,
                showPlantTitles: showPlantTitlesRef.current,
                getInitialGrow,
                plantScaleMultiplier: plantScaleMultiplierRef.current,
            });
            syncCameraFollowPlants(
                followPlantRootRef.current,
                camera,
                followPlants
            );
            updatePlantSway(
                plantRoot,
                elapsed,
                camera,
                growingPlantsRef.current,
                shrinkingPlantsRef.current
            );
            updatePlantSway(
                followPlantRootRef.current,
                elapsed,
                camera,
                growingPlantsRef.current,
                shrinkingPlantsRef.current
            );
            const plantMotion = plantMotionTrackerRef.current.measure(
                worldPlants,
                camera,
                elapsed,
                {
                    growingPlants: growingPlantsRef.current,
                    shrinkingPlants: shrinkingPlantsRef.current,
                    plantScaleMultiplier: plantScaleMultiplierRef.current,
                }
            );
            groundRipples.update(elapsed, camera);
            clouds?.update(elapsed, delta, camera);
            postProcessing.update(elapsed, { plants: plantMotion });
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

        if (gardenActionsRef) {
            gardenActionsRef.current = {
                lookAt: (x, y, z, duration) => {
                    walkControls?.startLookAt?.(x, y, z, duration);
                },
                shrinkPlant: (plant, onComplete) => {
                    const plantId = plant?.id;
                    if (!plantId || shrinkingPlantsRef.current.has(plantId)) {
                        return;
                    }

                    let initialGrow = 1;
                    const growingStartedAt =
                        growingPlantsRef.current.get(plantId);
                    if (growingStartedAt) {
                        initialGrow = plantGrowFactor(growingStartedAt);
                        growingPlantsRef.current.delete(plantId);
                    }

                    shrinkingPlantsRef.current.set(plantId, {
                        plant,
                        startedAt: performance.now(),
                        initialGrow,
                        onComplete,
                    });
                },
            };
        }

        cleanup = () => {
            if (gardenActionsRef) {
                gardenActionsRef.current = null;
            }
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
            if (followPlantStateRef.current.group) {
                followPlantRoot?.remove(followPlantStateRef.current.group);
                disposeObject(followPlantStateRef.current.group);
                followPlantStateRef.current.group = null;
                followPlantStateRef.current.plantKey = null;
            }
            if (territoryRef.current) {
                scene.remove(territoryRef.current);
                disposeObject(territoryRef.current);
                territoryRef.current = null;
            }
            groundRipples.dispose();
            clouds?.dispose();
            entrance?.dispose();
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
            followPlantRootRef.current = null;
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
        wrapMovement,
        cameraOffset.x,
        cameraOffset.y,
        cameraOffset.z,
        cameraTarget.x,
        cameraTarget.y,
        cameraTarget.z,
        freshSpawnLookTarget?.x,
        freshSpawnLookTarget?.y,
        freshSpawnLookTarget?.z,
        minDistance,
        maxDistance,
        walkPositionKey,
        movementBounds?.minX,
        movementBounds?.maxX,
        movementBounds?.minZ,
        movementBounds?.maxZ,
        showPlantTitles,
        showDateTerritories,
        showClouds,
        showEntrance,
        moonPosition?.x,
        moonPosition?.y,
        moonPosition?.z,
        moonLightTarget?.x,
        moonLightTarget?.y,
        moonLightTarget?.z,
        cloudAnchor?.x,
        cloudAnchor?.y,
        cloudAnchor?.z,
        cloudFollowCamera,
        plantScaleMultiplier,
        visibleChunkRadius,
        onWalkStateChange,
        gardenActionsRef,
        postProcessingPreset,
        postProcessingRef,
    ]);

    useEffect(() => {
        movementTerritoryRef.current = computeMovementTerritory(
            plants,
            wrapMovement,
            movementBounds
        );
        wasInsideTerritoryRef.current = null;
        previousTerritoryPositionRef.current = null;

        const currentPlantIds = new Set(
            normalizePlants(plants).map((plant) => plant.id)
        );

        knownPlantIdsRef.current.forEach((plantId) => {
            if (currentPlantIds.has(plantId)) return;

            knownPlantIdsRef.current.delete(plantId);
            growingPlantsRef.current.delete(plantId);
        });

        normalizePlants(plants).forEach((plant) => {
            if (plant.followsCamera) return;
            if (knownPlantIdsRef.current.has(plant.id)) return;

            if (hasInitializedPlantsRef.current) {
                growingPlantsRef.current.set(plant.id, performance.now());
            }

            knownPlantIdsRef.current.add(plant.id);
        });
        hasInitializedPlantsRef.current = true;
        plantMotionTrackerRef.current.reset();

        const { worldPlants, followPlants } = splitCameraFollowPlants(
            normalizePlants(getRenderablePlants())
        );

        syncGardenChunks({
            plantRoot: plantRootRef.current,
            loadedChunks: loadedChunksRef.current,
            plants: worldPlants,
            cameraPosition: cameraRef.current?.position ?? { x: 0, z: 0 },
            chunkRadius: visibleChunkRadiusRef.current,
            showPlantTitles,
            getInitialGrow,
            plantScaleMultiplier: plantScaleMultiplierRef.current,
        });
        syncFollowPlants({
            followRoot: followPlantRootRef.current,
            followState: followPlantStateRef.current,
            followPlants,
            showPlantTitles,
            getInitialGrow,
            plantScaleMultiplier: plantScaleMultiplierRef.current,
        });
        syncCameraFollowPlants(
            followPlantRootRef.current,
            cameraRef.current,
            followPlants
        );
        syncDateTerritories({
            scene: sceneRef.current,
            territoryRef,
            plants: normalizePlants(plants),
            enabled: showDateTerritories,
        });
    }, [plants, showPlantTitles, showDateTerritories, wrapMovement]);

    return (
        <div className={className}>
            <div ref={mountRef} className={canvasClassName} />
        </div>
    );
};

export default GardenScene;
