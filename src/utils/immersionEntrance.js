import * as THREE from "three";
import { hashString } from "@/utils/lSystem";
import {
    createConcreteWallMaterial,
    disposeConcreteWallMaterial,
} from "@/utils/immersionConcreteTexture";

const DEFAULT_OPTIONS = {
    width: 6.2,
    depth: 8, // 4.8`
    height: 14,
    tileSize: 2.2,
    color: 0x8a8a86,
    position: { x: 0, y: 0, z: -4 },
};

export const IMMERSION_ENTRANCE_DEFAULTS = {
    width: DEFAULT_OPTIONS.width,
    depth: DEFAULT_OPTIONS.depth,
    position: { ...DEFAULT_OPTIONS.position },
};

export const getImmersionLeftWallSpawn = ({
    width,
    depth,
    position,
} = IMMERSION_ENTRANCE_DEFAULTS) => {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const wallInset = 0.42;

    return {
        offset: {
            x: position.x - halfWidth + wallInset,
            y: 1.55,
            z: position.z + halfDepth - 0.55,
        },
        target: {
            x: position.x,
            y: 7,
            z: position.z + halfDepth + 3,
        },
    };
};

export const getImmersionMovementBounds = ({
    width,
    depth,
    position,
} = IMMERSION_ENTRANCE_DEFAULTS) => {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const wallInset = 0.42;
    const frontMargin = 2.5;

    return {
        minX: position.x - halfWidth + wallInset - 0.2,
        maxX: position.x + halfWidth - wallInset + 0.2,
        minZ: position.z - halfDepth + 0.3,
        maxZ: position.z + halfDepth + frontMargin,
    };
};

export const IMMERSION_PLANT_SCALE = 12.8;

export const IMMERSION_WITNESS_PLANT_ID = "__immersion-witness__";

export const createImmersionWitnessPlant = (plants = []) => {
    const source = plants[plants.length - 1] ?? plants[0];

    return {
        id: IMMERSION_WITNESS_PLANT_ID,
        text: source?.text ?? "witness",
        gardenId: source?.gardenId ?? "immersion",
        followsCamera: true,
        x: 0,
        z: 0,
    };
};

// Offsets from the entrance: x from center, z from the front edge.
const IMMERSION_TREE_SLOTS = [
    { x: 70, z: 40 },
    { x: 70, z: 50 },
    { x: 70, z: 60 },
    { x: 70, z: 70 },
    { x: -1, z: 0 },
    { x: -50, z: 40 },
    { x: -50, z: 70 },
];

export const layoutImmersionPlants = (
    plants = [],
    entrance = IMMERSION_ENTRANCE_DEFAULTS
) => {
    const frontZ = entrance.position.z + entrance.depth / 2;

    return plants.map((plant) => {
        const slotIndex =
            hashString(plant.id ?? plant.text ?? "") %
            IMMERSION_TREE_SLOTS.length;
        const slot = IMMERSION_TREE_SLOTS[slotIndex];

        return {
            ...plant,
            x: entrance.position.x + slot.x,
            z: frontZ + slot.z,
        };
    });

    return [...laidOut, createImmersionWitnessPlant(plants)];
};

export const getImmersionMoonPosition = (
    entrance = IMMERSION_ENTRANCE_DEFAULTS,
    spawn = getImmersionLeftWallSpawn(entrance)
) => {
    const view = new THREE.Vector3(
        spawn.target.x - spawn.offset.x,
        spawn.target.y - spawn.offset.y,
        spawn.target.z - spawn.offset.z
    ).normalize();

    return new THREE.Vector3(
        spawn.offset.x + view.x * 46,
        spawn.offset.y + view.y * 46 + 8,
        spawn.offset.z + view.z * 70
    );
};

const createWall = (width, height, material) =>
    new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);

export const createImmersionEntrance = (scene, options = {}) => {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const root = new THREE.Group();
    root.position.set(
        config.position.x,
        config.position.y,
        config.position.z
    );

    const halfWidth = config.width / 2;
    const halfDepth = config.depth / 2;
    const wallCenterY = config.height / 2;
    const materials = [];

    const backMaterial = createConcreteWallMaterial({
        repeatX: config.width / config.tileSize,
        repeatY: config.height / config.tileSize,
        color: config.color,
    });
    const sideMaterial = createConcreteWallMaterial({
        repeatX: config.depth / config.tileSize,
        repeatY: config.height / config.tileSize,
        color: config.color,
    });
    const roofMaterial = createConcreteWallMaterial({
        repeatX: config.width / config.tileSize,
        repeatY: config.depth / config.tileSize,
        color: config.color,
    });
    materials.push(backMaterial, sideMaterial, roofMaterial);

    const back = createWall(config.width, config.height, backMaterial);
    back.position.set(0, wallCenterY, -halfDepth);
    root.add(back);

    const left = createWall(config.depth, config.height, sideMaterial);
    left.position.set(-halfWidth, wallCenterY, 0);
    left.rotation.y = Math.PI / 2;
    root.add(left);

    const right = createWall(config.depth, config.height, sideMaterial);
    right.position.set(halfWidth, wallCenterY, 0);
    right.rotation.y = -Math.PI / 2;
    root.add(right);

    const roof = new THREE.Mesh(
        new THREE.PlaneGeometry(config.width, config.depth),
        roofMaterial
    );
    roof.rotation.x = Math.PI / 2;
    roof.position.set(0, config.height, 0);
    root.add(roof);

    scene.add(root);

    const fillLight = new THREE.HemisphereLight(0xc8ccd2, 0x3a3f44, 1.1);
    const keyLight = new THREE.DirectionalLight(0xe4e6ea, 0.85);
    keyLight.position.set(8, 20, 12);
    scene.add(fillLight, keyLight);

    const dispose = () => {
        scene.remove(fillLight);
        scene.remove(keyLight);
        root.traverse((node) => {
            if (node.geometry) node.geometry.dispose();
        });
        materials.forEach((material) => disposeConcreteWallMaterial(material));
        scene.remove(root);
    };

    return { root, dispose };
};
