import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
    buildForestLayout,
    createPlantBillboard,
} from "@/utils/plantBillboard";
import {
    buildFlowerPosition,
    createFlowerBillboard,
    flowerCountForLine,
} from "@/utils/flowerBillboard";
import {
    disposeGrassField,
    replaceGrassField,
} from "@/utils/grassField";

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
        mount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enabled = interactive;
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.maxPolarAngle = Math.PI / 2.1;
        controls.minDistance = 3;
        controls.maxDistance = 32;
        controls.target.set(0, 2.5, 0);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            new THREE.MeshBasicMaterial({ color: 0x070807 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        scene.add(ground);

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
        };

        let frame = 0;
        const animate = () => {
            frame = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const resizeObserver = new ResizeObserver(() => resize());
        resizeObserver.observe(mount);
        requestAnimationFrame(() => resize());

        return () => {
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            controls.dispose();
            if (grassRef.current) {
                scene.remove(grassRef.current);
                disposeGrassField(grassRef.current);
            }
            disposeObject(scene);
            renderer.dispose();
            sceneRef.current = null;
            plantRootRef.current = null;
            flowerRootRef.current = null;
            grassRef.current = null;
            if (mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement);
            }
        };
    }, [interactive, cameraOffset.x, cameraOffset.y, cameraOffset.z]);

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
