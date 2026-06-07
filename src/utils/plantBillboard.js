import * as THREE from "three";
import { hashString, textToPlant } from "@/utils/lSystem";
import {
    segmentStrokeColor,
    segmentStrokeWidth,
} from "@/utils/plantDraw";

const CANVAS_TARGET = 256;
const BASE_WORLD_HEIGHT = 2.6;
const FOREST_RADIUS = 34;
const CANDIDATE_COUNT = 42;
const RECENT_ANCHOR_WINDOW = 12;
const BASE_TREE_SPACING = 1.45;
const FOREST_DENSITY_SEED = "manifesto-forest-density";

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

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const lerp = (a, b, t) => a + (b - a) * t;

const smoothstep = (value) => value * value * (3 - 2 * value);

const hashUnit = (key) => hashString(key) / 0xffffffff;

const valueNoise2D = (x, z, seed) => {
    const floorX = Math.floor(x);
    const floorZ = Math.floor(z);
    const localX = smoothstep(x - floorX);
    const localZ = smoothstep(z - floorZ);

    const a = hashUnit(`${seed}:${floorX}:${floorZ}`);
    const b = hashUnit(`${seed}:${floorX + 1}:${floorZ}`);
    const c = hashUnit(`${seed}:${floorX}:${floorZ + 1}`);
    const d = hashUnit(`${seed}:${floorX + 1}:${floorZ + 1}`);

    return lerp(lerp(a, b, localX), lerp(c, d, localX), localZ);
};

const forestDensity = (x, z, seed) => {
    const large = valueNoise2D(x * 0.045, z * 0.045, `${seed}:large`);
    const medium = valueNoise2D(x * 0.09, z * 0.09, `${seed}:medium`);
    const detail = valueNoise2D(x * 0.18, z * 0.18, `${seed}:detail`);
    const mixed = large * 0.62 + medium * 0.28 + detail * 0.1;
    const distance = Math.hypot(x, z) / FOREST_RADIUS;
    const edgeFalloff = 1 - Math.pow(clamp01(distance), 3);

    return clamp01(mixed * 0.85 + edgeFalloff * 0.15);
};

const minSpacingForPlant = (plant) =>
    BASE_TREE_SPACING +
    plantWorldScale(plant.text, plant.id ?? plant.text) * 0.58;

const spacingScore = (candidate, positions) => {
    if (positions.length === 0) return 1;

    let nearestRatio = Infinity;
    let overlapPenalty = 0;

    positions.forEach((position) => {
        const required =
            (candidate.minSpacing +
                (position.minSpacing ?? BASE_TREE_SPACING * 1.5)) /
            2;
        const distance = Math.hypot(
            candidate.x - position.x,
            candidate.z - position.z
        );
        const ratio = distance / required;

        nearestRatio = Math.min(nearestRatio, ratio);
        if (ratio < 1) {
            overlapPenalty += (1 - ratio) * (1 - ratio);
        }
    });

    const tooIsolatedPenalty =
        nearestRatio > 2.8 ? (nearestRatio - 2.8) * 0.08 : 0;
    return (
        Math.min(nearestRatio, 1.4) * 0.9 -
        overlapPenalty * 7 -
        tooIsolatedPenalty
    );
};

const candidateForPlant = (plant, index, candidateIndex, anchor) => {
    const seed = `${plant.id ?? plant.text}:${index}:candidate:${candidateIndex}`;
    const hash = hashString(seed);
    const angle =
        ((hash >> 4) % 628) / 100 +
        ((candidateIndex / CANDIDATE_COUNT) * Math.PI * 2) / 3;
    const spread = 2.4 + Math.sqrt(index) * 0.16;
    const distance = 1.65 + ((hash >> 13) % 1000) / 1000 * spread;

    return {
        x: anchor.x + Math.cos(angle) * distance,
        z: anchor.z + Math.sin(angle) * distance,
        jitter: ((hash >> 23) % 1000) / 1000,
        minSpacing: minSpacingForPlant(plant),
    };
};

const scoreCandidate = (candidate, positions, index, forestSeed) => {
    const distanceFromCenter = Math.hypot(candidate.x, candidate.z);
    if (distanceFromCenter > FOREST_RADIUS) return -Infinity;

    const density = forestDensity(candidate.x, candidate.z, forestSeed);
    const spacing = spacingScore(candidate, positions);
    const expansion = clamp01(
        distanceFromCenter / (Math.sqrt(index) * 1.2 + 3)
    );
    const edgePenalty = Math.pow(distanceFromCenter / FOREST_RADIUS, 4) * 0.85;

    return (
        density * 2.1 +
        spacing +
        expansion * 0.28 +
        candidate.jitter * 0.08 -
        edgePenalty
    );
};

export const buildForestLayout = (plants) => {
    const positions = [];

    plants.forEach((plant, index) => {
        const hash = hashString(`${plant.id ?? plant.text}:${index}`);

        if (index === 0) {
            positions.push({
                x: 0,
                z: 0,
                minSpacing: minSpacingForPlant(plant),
            });
            return;
        }

        const recentWindow = Math.min(index, RECENT_ANCHOR_WINDOW);
        const anchorIndex = index - 1 - (hash % recentWindow);
        const anchor =
            positions[anchorIndex] ?? positions[index - 1] ?? { x: 0, z: 0 };
        let bestCandidate = null;
        let bestScore = -Infinity;

        for (
            let candidateIndex = 0;
            candidateIndex < CANDIDATE_COUNT;
            candidateIndex++
        ) {
            const candidate = candidateForPlant(
                plant,
                index,
                candidateIndex,
                anchor
            );
            const score = scoreCandidate(
                candidate,
                positions,
                index,
                FOREST_DENSITY_SEED
            );

            if (!bestCandidate || score > bestScore) {
                bestCandidate = candidate;
                bestScore = score;
            }
        }

        positions.push({
            x: bestCandidate?.x ?? anchor.x,
            z: bestCandidate?.z ?? anchor.z,
            minSpacing: bestCandidate?.minSpacing ?? minSpacingForPlant(plant),
        });
    });

    return positions;
};
