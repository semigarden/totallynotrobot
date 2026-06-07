import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
    buildForestLayout,
    createPlantBillboard,
} from "@/utils/plantBillboard";
import styles from "@/styles/Garden.module.scss";

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

const populatePlants = (plantRoot, plants) => {
    if (!plantRoot) return;

    while (plantRoot.children.length > 0) {
        const child = plantRoot.children[0];
        plantRoot.remove(child);
        disposeObject(child);
    }

    const layout = buildForestLayout(plants);

    plants.forEach((plant, index) => {
        const billboard = createPlantBillboard(plant.text, plant.id);
        const position = layout[index];
        billboard.position.set(position.x, 0, position.z);
        plantRoot.add(billboard);
    });
};

const GardenSpace = ({ plants = [] }) => {
    const mountRef = useRef(null);
    const plantRootRef = useRef(null);
    const plantsRef = useRef(plants);

    plantsRef.current = plants;

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000100);
        scene.fog = new THREE.Fog(0x000100, 32, 80);

        const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
        camera.position.set(0, 7, 11);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.maxPolarAngle = Math.PI / 2.1;
        controls.minDistance = 3;
        controls.maxDistance = 32;
        controls.target.set(0, 2.5, 0);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        scene.add(ground);

        const grid = new THREE.GridHelper(80, 40, 0x3a3a3a, 0x1c1c1c);
        grid.position.y = 0.01;
        scene.add(grid);

        const plantRoot = new THREE.Group();
        scene.add(plantRoot);
        plantRootRef.current = plantRoot;
        populatePlants(plantRoot, plantsRef.current);

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
            disposeObject(scene);
            renderer.dispose();
            plantRootRef.current = null;
            if (mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement);
            }
        };
    }, []);

    useEffect(() => {
        populatePlants(plantRootRef.current, plants);
    }, [plants]);

    return (
        <div className={styles.space}>
            <div ref={mountRef} className={styles.canvas} />
            <div className={styles.spaceHint}>
                drag to orbit · scroll to zoom · {plants.length}{" "}
                {plants.length === 1 ? "plant" : "plants"}
            </div>
        </div>
    );
};

export default GardenSpace;
