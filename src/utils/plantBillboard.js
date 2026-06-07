import * as THREE from "three";
import { hashString, textToPlant } from "@/utils/lSystem";
import {
    segmentStrokeColor,
    segmentStrokeWidth,
} from "@/utils/plantDraw";

const CANVAS_TARGET = 256;

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
        depthWrite: true,
    });

    const sprite = new THREE.Sprite(material);
    const aspect = plant.width / Math.max(plant.height, 1);
    const worldHeight = 2.6;
    sprite.scale.set(worldHeight * aspect, worldHeight, 1);
    sprite.center.set(0.5, 0);

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

        const recentWindow = Math.min(index, 8);
        const anchorIndex = index - 1 - (hash % recentWindow);
        const anchor = positions[anchorIndex];

        const angle = ((hash >> 8) % 628) / 100;
        const distance = 0.65 + ((hash >> 14) % 160) / 100;

        let x = anchor.x + Math.cos(angle) * distance;
        let z = anchor.z + Math.sin(angle) * distance;

        const distFromCenter = Math.hypot(x, z);
        const shell = Math.sqrt(index) * 0.55;
        if (distFromCenter > shell && index > 2) {
            const pull = 0.18;
            x -= (x / distFromCenter) * pull;
            z -= (z / distFromCenter) * pull;
        }

        positions.push({ x, z });
    });

    return positions;
};
