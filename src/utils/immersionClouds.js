import * as THREE from "three";
import { createImmersionCloudMaterial } from "@/utils/immersionCloudShader";

const DEFAULT_OPTIONS = {
    layerCount: 11,
    color: 0x8d8d8d,
    opacity: 0.74,
    minHeight: 16,
    maxHeight: 34,
    spreadX: 58,
    spreadZ: 48,
    minSize: 24,
    maxSize: 44,
};

const createCloudLayer = (config, index) => {
    const width =
        config.minSize + Math.random() * (config.maxSize - config.minSize);
    const depth = width * (0.72 + Math.random() * 0.28);
    const geometry = new THREE.PlaneGeometry(width, depth, 1, 1);
    const material = createImmersionCloudMaterial({
        color: config.color,
        opacity: config.opacity * (0.82 + Math.random() * 0.18),
        coverage: -0.02 + Math.random() * 0.08,
        softness: 0.18 + Math.random() * 0.12,
        offset: new THREE.Vector3(
            Math.random() * 40.0,
            Math.random() * 8.0,
            Math.random() * 40.0
        ),
        wind: new THREE.Vector3(
            0.012 + Math.random() * 0.01,
            0.0,
            (Math.random() - 0.5) * 0.01
        ),
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(
        (Math.random() - 0.5) * config.spreadX,
        config.minHeight +
            (index / Math.max(config.layerCount - 1, 1)) *
                (config.maxHeight - config.minHeight) +
            Math.random() * 2.5,
        (Math.random() - 0.5) * config.spreadZ - 10
    );
    mesh.renderOrder = 1;
    mesh.userData.drift = {
        x: (Math.random() - 0.5) * 0.06,
        z: (Math.random() - 0.5) * 0.04,
    };

    return mesh;
};

export const createImmersionClouds = (scene, options = {}) => {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const root = new THREE.Group();
    const materials = [];

    for (let index = 0; index < config.layerCount; index += 1) {
        const layer = createCloudLayer(config, index);
        materials.push(layer.material);
        root.add(layer);
    }

    scene.add(root);

    const update = (elapsed, delta, camera) => {
        if (camera) {
            root.position.x = camera.position.x;
            root.position.z = camera.position.z;
        }

        materials.forEach((material) => {
            material.uniforms.uTime.value = elapsed;
        });

        root.children.forEach((layer) => {
            const drift = layer.userData.drift;
            layer.position.x += drift.x * delta;
            layer.position.z += drift.z * delta;
        });
    };

    const dispose = () => {
        root.traverse((node) => {
            if (node.geometry) node.geometry.dispose();
        });
        materials.forEach((material) => material.dispose());
        scene.remove(root);
    };

    return { root, update, dispose };
};
