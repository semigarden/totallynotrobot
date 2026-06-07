import * as THREE from "three";
import { hashString } from "@/utils/lSystem";

const CANVAS_WIDTH = 80;
const CANVAS_HEIGHT = 96;

export const textToFlower = (text, seed = "") => {
    const hash = hashString(`${text}:${seed}:flower`);

    return {
        petalCount: 4 + (hash % 6),
        petalLength: 11 + (hash % 14),
        stemHeight: 24 + (hash % 28),
        lean: ((hash >> 4) % 24) - 12,
        rotation: ((hash >> 8) % 628) / 100,
        ringCount: 1 + ((hash >> 12) % 2),
        openness: 0.55 + ((hash >> 16) % 40) / 100,
        centerRadius: 2 + (hash % 4),
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
    };
};

export const flowerCountForLine = (text, seed = "") => {
    const hash = hashString(`${text}:${seed}:flower-count`);
    return 1 + (hash % 5);
};

export const renderFlowerToCanvas = (flower) => {
    const canvas = document.createElement("canvas");
    canvas.width = flower.width;
    canvas.height = flower.height;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";

    const groundY = flower.height - 8;
    const stemTopY = groundY - flower.stemHeight;
    const centerX = flower.width / 2 + flower.lean * 0.35;
    const centerY = stemTopY + 2;

    context.strokeStyle = "rgba(255, 255, 255, 0.62)";
    context.lineWidth = 1.6;
    context.beginPath();
    context.moveTo(flower.width / 2, groundY);
    context.quadraticCurveTo(
        flower.width / 2 + flower.lean * 0.2,
        (groundY + stemTopY) / 2,
        centerX,
        centerY
    );
    context.stroke();

    for (let ring = 0; ring < flower.ringCount; ring++) {
        const ringScale = 1 - ring * 0.22;
        const petalLength = flower.petalLength * ringScale;
        const petalCount = flower.petalCount + ring * 2;

        for (let index = 0; index < petalCount; index++) {
            const angle =
                flower.rotation +
                ((Math.PI * 2) / petalCount) * index +
                ring * 0.2;
            const tipX = centerX + Math.cos(angle) * petalLength * flower.openness;
            const tipY = centerY + Math.sin(angle) * petalLength * 0.72;
            const ctrlX =
                centerX + Math.cos(angle + 0.35) * petalLength * 0.45;
            const ctrlY =
                centerY + Math.sin(angle + 0.35) * petalLength * 0.3;

            context.strokeStyle = `rgba(255, 255, 255, ${0.78 - ring * 0.16})`;
            context.lineWidth = Math.max(0.8, 1.5 - ring * 0.25);
            context.beginPath();
            context.moveTo(centerX, centerY);
            context.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
            context.stroke();
        }
    }

    context.fillStyle = "rgba(255, 255, 255, 0.9)";
    context.beginPath();
    context.arc(centerX, centerY, flower.centerRadius, 0, Math.PI * 2);
    context.fill();

    return canvas;
};

export const createFlowerBillboard = (text, seed = "", sizeScale = 1) => {
    const flower = textToFlower(text, seed);
    const canvas = renderFlowerToCanvas(flower);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: true,
    });

    const sprite = new THREE.Sprite(material);
    const aspect = flower.width / flower.height;
    const worldHeight = 1.05 * sizeScale;
    sprite.scale.set(worldHeight * aspect, worldHeight, 1);
    sprite.center.set(0.5, 0);

    return sprite;
};

export const buildFlowerPosition = (plant, anchor, flowerIndex) => {
    const hash = hashString(
        `${plant.text}:${plant.id}:flower-pos:${flowerIndex}`
    );
    const angle = ((hash >> 4) % 628) / 100;
    const distance = 0.28 + ((hash >> 10) % 150) / 100;

    return {
        x: anchor.x + Math.cos(angle) * distance,
        z: anchor.z + Math.sin(angle) * distance,
        scale: 0.7 + ((hash >> 14) % 55) / 100,
    };
};
