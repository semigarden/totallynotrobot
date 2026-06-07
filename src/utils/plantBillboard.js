import * as THREE from "three";
import { hashString, textToPlant } from "@/utils/lSystem";
import {
    segmentStrokeColor,
    segmentStrokeWidth,
} from "@/utils/plantDraw";

const CANVAS_TARGET = 256;
const BASE_WORLD_HEIGHT = 2.6;

export const plantWorldScale = (text, seed = "") => {
    const hash = hashString(`${text}:${seed}`);
    return 0.68 + ((hash >> 16) % 88) / 100;
};

export const renderPlantToCanvas = (plant) => {
    const canvas = document.createElement("canvas");
    const scale = CANVAS_TARGET / Math.max(plant.width, plant.height, 1);
    canvas.width = Math.max(1, Math.ceil(plant.width * scale));
    canvas.height = Math.max(1, Math.ceil(plant.height * scale));

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";

    plant.segments.forEach((segment) => {
        context.strokeStyle = segmentStrokeColor(segment.depth);
        context.lineWidth = segmentStrokeWidth(segment.depth) * scale;
        context.beginPath();
        context.moveTo(segment.x1 * scale, segment.y1 * scale);
        context.lineTo(segment.x2 * scale, segment.y2 * scale);
        context.stroke();
    });

    return canvas;
};

export const createPlantBillboard = (text, seed = "") => {
    const plant = textToPlant(text, seed);
    const canvas = renderPlantToCanvas(plant);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.02,
        depthWrite: false,
        depthTest: true,
    });

    const sprite = new THREE.Sprite(material);
    const aspect = plant.width / Math.max(plant.height, 1);
    const sizeScale = plantWorldScale(text, seed);
    const worldHeight = BASE_WORLD_HEIGHT * sizeScale;
    sprite.scale.set(worldHeight * aspect, worldHeight, 1);
    sprite.center.set(0.5, 0);
    sprite.userData.sizeScale = sizeScale;

    return sprite;
};

export const buildForestLayout = (plants) => {
    const positions = [];

    plants.forEach((plant, index) => {
        const hash = hashString(`${plant.id ?? plant.text}:${index}`);

        if (index === 0) {
            positions.push({ x: 0, z: 0 });
            return;
        }

        const recentWindow = Math.min(index, 10);
        const anchorIndex = index - 1 - (hash % recentWindow);
        const anchor =
            positions[anchorIndex] ?? positions[index - 1] ?? { x: 0, z: 0 };

        const angle = ((hash >> 8) % 628) / 100;
        const distance = 1.4 + ((hash >> 14) % 220) / 100;

        let x = anchor.x + Math.cos(angle) * distance;
        let z = anchor.z + Math.sin(angle) * distance;

        const distFromCenter = Math.hypot(x, z);
        const shell = Math.sqrt(index) * 0.9;
        if (distFromCenter > shell && index > 2) {
            const pull = 0.08;
            x -= (x / distFromCenter) * pull;
            z -= (z / distFromCenter) * pull;
        }

        positions.push({ x, z });
    });

    return positions;
};
