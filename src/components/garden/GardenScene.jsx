import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
    buildForestLayout,
    createPlantBillboard,
} from "@/utils/plantBillboard";
import { initPlantSway, updatePlantSway } from "@/utils/plantMotion";
import {
    buildFlowerPosition,
    createFlowerBillboard,
    flowerCountForLine,
} from "@/utils/flowerBillboard";
import {
    disposeGrassField,
    replaceGrassField,
} from "@/utils/grassField";
import {
    attachGardenWalkControls,
    attachScrollWalk,
    clampWalkPosition,
} from "@/utils/gardenNavigation";
import { createMoon } from "@/utils/moonScene";
import { createGardenComposer } from "@/utils/gardenPostProcessing";

const FLOWERS_ENABLED = false;

const disposeObject = (object) => {
    object.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
            if (node.material.map) node.material.map.dispose();
            if (Array.isArray(node.material)) {
                node.material.forEach((material) => {
                    if (material.map) material.map.dispose();
                    material.dispose();
                });
            } else {
                node.material.dispose();
            }
        }
    });
};

const normalizePlants = (plants) =>
    Array.isArray(plants) ? plants.filter((plant) => plant?.text) : [];

const populateGarden = (scene, plantRoot, flowerRoot, grassRef, plants) => {
    const gardenPlants = normalizePlants(plants);
    const layout = buildForestLayout(gardenPlants);

    if (plantRoot) {
        while (plantRoot.children.length > 0) {
            const child = plantRoot.children[0];
            plantRoot.remove(child);
            disposeObject(child);
        }

        gardenPlants.forEach((plant, index) => {
            const billboard = createPlantBillboard(plant.text, plant.id);
            const position = layout[index];
            billboard.position.set(position.x, 0, position.z);
            initPlantSway(billboard, plant.id ?? plant.text);
            plantRoot.add(billboard);
        });
    }

    if (FLOWERS_ENABLED && flowerRoot) {
        while (flowerRoot.children.length > 0) {
            const child = flowerRoot.children[0];
            flowerRoot.remove(child);
            disposeObject(child);
        }

        gardenPlants.forEach((plant, index) => {
            const anchor = layout[index] ?? { x: 0, z: 0 };
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
                flowerRoot.add(flower);
            }
        });
    }

    if (scene && grassRef) {
        if (grassRef.current) {
            scene.remove(grassRef.current);
        }

        const nextGrass = replaceGrassField(
            grassRef.current,
            gardenPlants,
            layout
        );
        nextGrass.position.y = 0.02;
        scene.add(nextGrass);
        grassRef.current = nextGrass;
    }

    return layout;
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
}) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const plantRootRef = useRef(null);
    const flowerRootRef = useRef(null);
    const grassRef = useRef(null);
    const plantsRef = useRef(plants);

    plantsRef.current = plants;

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000100);
        scene.fog = new THREE.Fog(0x000100, 32, 80);

        const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
        camera.position.set(cameraOffset.x, cameraOffset.y, cameraOffset.z);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        mount.appendChild(renderer.domElement);

        const postProcessing = createGardenComposer(renderer, scene, camera);

        let controls = null;
        let walkControls = null;
        let detachScrollWalk = null;

        if (walkNavigation) {
            walkControls = attachGardenWalkControls({
                camera,
                domElement: renderer.domElement,
                cameraY: cameraOffset.y,
                initialOffset: cameraOffset,
                lookTarget: cameraTarget,
                enabled: interactive,
                pinchSpeed: walkSpeed * 3.5,
            });

            if (scrollWalk) {
                detachScrollWalk = attachScrollWalk({
                    camera,
                    domElement: renderer.domElement,
                    speed: walkSpeed,
                    onMove: (move) => {
                        const state = walkControls.getState();
                        state.x += move.x;
                        state.z += move.z;
                        clampWalkPosition(state);
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

                        const dist = Math.hypot(camera.position.x, camera.position.z);
                        if (dist > 36) {
                            const scale = 36 / dist;
                            camera.position.x *= scale;
                            camera.position.z *= scale;
                            target.x *= scale;
                            target.z *= scale;
                        }
                    },
                });
            }
        }

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            new THREE.MeshBasicMaterial({ color: 0x070807 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        scene.add(ground);

        const moonRoot = createMoon(scene);

        sceneRef.current = scene;

        const plantRoot = new THREE.Group();
        scene.add(plantRoot);
        plantRootRef.current = plantRoot;

        const flowerRoot = FLOWERS_ENABLED ? new THREE.Group() : null;
        if (flowerRoot) {
            scene.add(flowerRoot);
        }
        flowerRootRef.current = flowerRoot;

        populateGarden(
            scene,
            plantRoot,
            flowerRoot,
            grassRef,
            normalizePlants(plantsRef.current)
        );

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
            updatePlantSway(plantRoot, clock.getElapsedTime());
            postProcessing.composer.render();
        };
        animate();

        const resizeObserver = new ResizeObserver(() => resize());
        resizeObserver.observe(mount);
        requestAnimationFrame(() => resize());

        return () => {
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            detachScrollWalk?.();
            walkControls?.dispose();
            controls?.dispose();
            if (grassRef.current) {
                scene.remove(grassRef.current);
                disposeGrassField(grassRef.current);
            }
            scene.remove(moonRoot);
            disposeObject(moonRoot);
            disposeObject(scene);
            postProcessing.dispose();
            renderer.dispose();
            sceneRef.current = null;
            plantRootRef.current = null;
            flowerRootRef.current = null;
            grassRef.current = null;
            if (mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement);
            }
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
    ]);

    useEffect(() => {
        populateGarden(
            sceneRef.current,
            plantRootRef.current,
            flowerRootRef.current,
            grassRef,
            plants
        );
    }, [plants]);

    return (
        <div className={className}>
            <div ref={mountRef} className={canvasClassName} />
        </div>
    );
};

export default GardenScene;
