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
    anchor: null,
    followCamera: true,
    moonHeight: null,
};

const createCloudLayer = (config, index, overrides = {}) => {
    const width =
        (overrides.width ??
            config.minSize + Math.random() * (config.maxSize - config.minSize));
    const depth = width * (overrides.depthScale ?? 0.72 + Math.random() * 0.28);
    const geometry = new THREE.PlaneGeometry(width, depth, 1, 1);
    const material = createImmersionCloudMaterial({
        color: config.color,
        opacity:
            config.opacity *
            (overrides.opacityScale ?? 0.82 + Math.random() * 0.18),
        coverage:
            overrides.coverage ?? -0.02 + Math.random() * 0.08,
        softness:
            overrides.softness ?? 0.18 + Math.random() * 0.12,
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
    mesh.rotation.x = Math.PI / 2;

    const heightRange = config.maxHeight - config.minHeight;
    const layerHeight =
        overrides.y ??
        config.minHeight +
            (index / Math.max(config.layerCount - 1, 1)) * heightRange +
            Math.random() * 2.5;

    mesh.position.set(
        overrides.x ?? (Math.random() - 0.5) * config.spreadX,
        layerHeight,
        overrides.z ?? (Math.random() - 0.5) * config.spreadZ - 10
    );
    mesh.renderOrder = index + 2;
    material.polygonOffset = true;
    material.polygonOffsetFactor = -2;
    material.polygonOffsetUnits = -index - 1;
    mesh.userData.drift = {
        x: (Math.random() - 0.5) * 0.06,
        z: (Math.random() - 0.5) * 0.04,
    };

    return { mesh, material };
};

const addMoonHaloLayers = (root, materials, config) => {
    if (!Number.isFinite(config.moonHeight)) return;

    for (let index = 0; index < 5; index += 1) {
        const { mesh, material } = createCloudLayer(
            config,
            config.layerCount + index,
            {
                width: 34 + Math.random() * 16,
                depthScale: 0.82,
                opacityScale: 0.9,
                coverage: -0.03 + Math.random() * 0.04,
                softness: 0.22 + Math.random() * 0.08,
                x: (Math.random() - 0.5) * 18,
                z: (Math.random() - 0.5) * 18,
                y:
                    config.moonHeight -
                    4 +
                    index * 1.6 +
                    Math.random() * 1.2,
            }
        );
        mesh.userData.drift = {
            x: (Math.random() - 0.5) * 0.03,
            z: (Math.random() - 0.5) * 0.03,
        };
        materials.push(material);
        root.add(mesh);
    }
};

export const createImmersionClouds = (scene, options = {}) => {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const root = new THREE.Group();
    const materials = [];
    const followCamera = config.followCamera && !config.anchor;

    if (config.anchor) {
        root.position.set(config.anchor.x, 0, config.anchor.z);
    }

    for (let index = 0; index < config.layerCount; index += 1) {
        const { mesh, material } = createCloudLayer(config, index);
        materials.push(material);
        root.add(mesh);
    }

    addMoonHaloLayers(root, materials, config);

    scene.add(root);

    const update = (elapsed, delta, camera) => {
        if (followCamera && camera) {
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
