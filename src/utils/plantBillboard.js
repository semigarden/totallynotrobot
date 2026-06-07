import * as THREE from "three";
import { hashString, textToPlant } from "@/utils/lSystem";
import {
    applyGardenTextureQuality,
    applyPlantTextureQuality,
} from "@/utils/gardenRenderer";
import {
    segmentStrokeColor,
    segmentStrokeWidth,
} from "@/utils/plantDraw";
import { buildPlantPhenotype } from "@/utils/plantPhenotype";

const CANVAS_TARGET = 256;
const BASE_WORLD_HEIGHT = 2.6;
const FOREST_RADIUS = 34;
const CANDIDATE_COUNT = 42;
const RECENT_ANCHOR_WINDOW = 12;
const BASE_TREE_SPACING = 1.45;
const FOREST_DENSITY_SEED = "manifesto-forest-density";
const PLAYER_PLACEMENT_RADIUS = 4.5;

export const plantWorldScale = (text, seed = "") => {
    const hash = hashString(`${text}:${seed}`);
    return 0.68 + ((hash >> 16) % 88) / 100;
};

const phenotypeStrokeColor = (segment, phenotype) => {
    if (!phenotype) return segmentStrokeColor(segment.depth);

    const depthLightness = Math.max(52, phenotype.lightness - segment.depth * 7);
    const opacity = Math.max(
        0.22,
        (0.95 - segment.depth * 0.12) * phenotype.opacityScale
    );
    const channel = Math.round(depthLightness * 2.55);

    return `rgba(${channel}, ${channel}, ${channel}, ${opacity})`;
};

export const renderPlantToCanvas = (plant, canvasTarget = CANVAS_TARGET) => {
    const canvas = document.createElement("canvas");
    const scale = canvasTarget / Math.max(plant.width, plant.height, 1);
    canvas.width = Math.max(1, Math.ceil(plant.width * scale));
    canvas.height = Math.max(1, Math.ceil(plant.height * scale));

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.lineCap = "round";
    context.lineJoin = "round";

    plant.segments.forEach((segment) => {
        context.strokeStyle = phenotypeStrokeColor(segment, plant.phenotype);
        context.lineWidth =
            segmentStrokeWidth(segment.depth) *
            (plant.phenotype?.strokeScale ?? 1) *
            scale;
        context.beginPath();
        context.moveTo(segment.x1 * scale, segment.y1 * scale);
        context.lineTo(segment.x2 * scale, segment.y2 * scale);
        context.stroke();
    });

    return canvas;
};

export const createPlantBillboard = (text, seed = "", options = {}) => {
    const phenotype = buildPlantPhenotype({
        text,
        id: seed,
        gardenId: options.gardenId,
        pubDate: options.pubDate,
        at: options.at,
    });
    const plant = textToPlant(text, seed, phenotype);
    const sizeScale = phenotype.sizeScale ?? plantWorldScale(text, seed);
    const worldHeight = BASE_WORLD_HEIGHT * sizeScale;
    const canvas = renderPlantToCanvas(plant);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    applyPlantTextureQuality(texture);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.008,
        depthWrite: false,
        depthTest: true,
    });

    const sprite = new THREE.Sprite(material);
    const aspect = plant.width / Math.max(plant.height, 1);
    sprite.scale.set(worldHeight * aspect, worldHeight, 1);
    sprite.center.set(0.5, 0);
    sprite.userData.sizeScale = sizeScale;

    return sprite;
};

export const createPlantRenderAsset = (text, seed = "", options = {}) => {
    const phenotype = buildPlantPhenotype({
        text,
        id: seed,
        gardenId: options.gardenId,
        pubDate: options.pubDate,
        at: options.at,
    });
    const plant = textToPlant(text, seed, phenotype);
    const sizeScale = phenotype.sizeScale ?? plantWorldScale(text, seed);
    const worldHeight = BASE_WORLD_HEIGHT * sizeScale;
    const canvas = renderPlantToCanvas(plant);
    const aspect = plant.width / Math.max(plant.height, 1);

    return {
        canvas,
        sizeScale,
        worldWidth: worldHeight * aspect,
        worldHeight,
    };
};

const wrapLabelLines = (context, text, maxWidth, maxLines = 3) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";

    words.forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (context.measureText(candidate).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    });

    if (line) lines.push(line);
    return lines.slice(0, maxLines);
};

const formatPlantDate = (value) => {
    if (value == null || value === "") return null;

    const timestamp =
        typeof value === "number" ? value : Date.parse(String(value));
    if (!Number.isFinite(timestamp)) return null;

    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(timestamp);
};

export const createPlantTitleLabel = (title, seed = "", date = null) => {
    const display = String(title ?? "").trim().slice(0, 72);
    const dateLabel = formatPlantDate(date);
    if (!display && !dateLabel) return null;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const titleFontSize = 20;
    const dateFontSize = 14;
    const padding = 10;
    const maxTextWidth = 260;
    const titleFont = `500 ${titleFontSize}px ui-sans-serif, system-ui, sans-serif`;
    const dateFont = `400 ${dateFontSize}px ui-sans-serif, system-ui, sans-serif`;
    const titleLineHeight = titleFontSize * 1.3;
    const dateLineHeight = dateFontSize * 1.45;

    context.font = titleFont;
    const titleLines = display
        ? wrapLabelLines(context, display, maxTextWidth, dateLabel ? 2 : 3)
        : [];
    const contentHeight =
        titleLines.length * titleLineHeight +
        (dateLabel ? dateLineHeight + 4 : 0);

    canvas.width = maxTextWidth + padding * 2;
    canvas.height = Math.ceil(contentHeight + padding * 2);

    context.textAlign = "center";
    context.textBaseline = "middle";

    const backgroundHeight = contentHeight + padding;
    context.fillStyle = "rgba(0, 8, 4, 0.42)";
    context.beginPath();
    context.roundRect(
        padding * 0.35,
        padding * 0.35,
        canvas.width - padding * 0.7,
        backgroundHeight,
        8
    );
    context.fill();

    context.font = titleFont;
    titleLines.forEach((line, index) => {
        const y = padding + titleLineHeight * index + titleLineHeight / 2;
        context.fillStyle = "rgba(245, 245, 245, 0.94)";
        context.fillText(line, canvas.width / 2, y);
    });

    if (dateLabel) {
        context.font = dateFont;
        const y =
            padding +
            titleLines.length * titleLineHeight +
            dateLineHeight / 2 +
            4;
        context.fillStyle = "rgba(205, 205, 205, 0.72)";
        context.fillText(dateLabel, canvas.width / 2, y);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    applyGardenTextureQuality(texture);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: true,
    });

    const sprite = new THREE.Sprite(material);
    const worldWidth = 2.6;
    const aspect = canvas.width / Math.max(canvas.height, 1);
    sprite.scale.set(worldWidth, worldWidth / aspect, 1);
    sprite.center.set(0.5, 0);
    sprite.userData.isPlantTitle = true;
    sprite.userData.titleSeed = seed;

    return sprite;
};

export const createPlantNameLabel = (name, seed = "") => {
    const display = String(name ?? "").trim().slice(0, 48);
    if (!display) return null;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const fontSize = 15;
    const paddingX = 12;
    const paddingY = 6;
    const maxTextWidth = 190;
    const font = `500 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;

    context.font = font;
    const textWidth = Math.min(context.measureText(display).width, maxTextWidth);
    canvas.width = Math.ceil(textWidth + paddingX * 2);
    canvas.height = Math.ceil(fontSize * 1.6 + paddingY * 2);

    context.font = font;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "rgba(0, 8, 4, 0.34)";
    context.beginPath();
    context.roundRect(0.5, 0.5, canvas.width - 1, canvas.height - 1, 999);
    context.fill();

    context.fillStyle = "rgba(220, 220, 220, 0.82)";
    context.fillText(display, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    applyGardenTextureQuality(texture);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: true,
    });

    const sprite = new THREE.Sprite(material);
    const worldWidth = 1.45;
    const aspect = canvas.width / Math.max(canvas.height, 1);
    sprite.scale.set(worldWidth, worldWidth / aspect, 1);
    sprite.center.set(0.5, 0.5);
    sprite.userData.isPlantName = true;
    sprite.userData.nameSeed = seed;

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

export const minSpacingForPlant = (plant) =>
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

const scoreAnchoredCandidate = (candidate, positions, anchor) => {
    const density = forestDensity(candidate.x, candidate.z, FOREST_DENSITY_SEED);
    const spacing = spacingScore(candidate, positions);
    const distanceFromAnchor = Math.hypot(
        candidate.x - anchor.x,
        candidate.z - anchor.z
    );

    return (
        density * 1.8 +
        spacing -
        distanceFromAnchor * 0.035 +
        candidate.jitter * 0.12
    );
};

export const placePlantNear = (
    plant,
    existingPlants = [],
    anchor = { x: 0, z: 0 }
) => {
    const positions = existingPlants
        .filter(
            (existingPlant) =>
                existingPlant?.id !== plant?.id &&
                Number.isFinite(existingPlant?.x) &&
                Number.isFinite(existingPlant?.z)
        )
        .map((existingPlant) => ({
            x: existingPlant.x,
            z: existingPlant.z,
            minSpacing: minSpacingForPlant(existingPlant),
        }));
    const safeAnchor = {
        x: Number.isFinite(anchor?.x) ? anchor.x : 0,
        z: Number.isFinite(anchor?.z) ? anchor.z : 0,
    };
    let bestCandidate = null;
    let bestScore = -Infinity;

    for (let index = 0; index < CANDIDATE_COUNT; index++) {
        const hash = hashString(`${plant.id ?? plant.text}:near:${index}`);
        const angle =
            ((hash >> 5) % 628) / 100 +
            (index / CANDIDATE_COUNT) * Math.PI * 2;
        const distance =
            0.9 + (((hash >> 13) % 1000) / 1000) * PLAYER_PLACEMENT_RADIUS;
        const candidate = {
            x: safeAnchor.x + Math.cos(angle) * distance,
            z: safeAnchor.z + Math.sin(angle) * distance,
            jitter: ((hash >> 23) % 1000) / 1000,
            minSpacing: minSpacingForPlant(plant),
        };
        const score = scoreAnchoredCandidate(candidate, positions, safeAnchor);

        if (!bestCandidate || score > bestScore) {
            bestCandidate = candidate;
            bestScore = score;
        }
    }

    return bestCandidate ?? {
        x: safeAnchor.x,
        z: safeAnchor.z,
        minSpacing: minSpacingForPlant(plant),
    };
};

const daysBetween = (left, right) =>
    Math.abs((left || 0) - (right || 0)) / 86_400_000;

const findDateAnchor = (plant, placed) => {
    if (placed.length === 0) return null;

    let best = placed[0];
    let bestGap = daysBetween(plant.at, best.at);

    placed.forEach((candidate) => {
        const gap = daysBetween(plant.at, candidate.at);
        if (gap < bestGap) {
            best = candidate;
            bestGap = gap;
        }
    });

    return best;
};

export const buildDateForestLayout = (plants) => {
    const sorted = [...plants].sort((left, right) => (left.at || 0) - (right.at || 0));
    const layoutById = new Map();
    const placed = [];

    sorted.forEach((plant, index) => {
        if (index === 0) {
            const origin = {
                x: 0,
                z: 0,
                minSpacing: minSpacingForPlant(plant),
            };
            layoutById.set(plant.id, origin);
            placed.push({ ...plant, ...origin });
            return;
        }

        const anchorPlant = findDateAnchor(plant, placed);
        const anchor = { x: anchorPlant.x, z: anchorPlant.z };
        const candidate = placePlantNear(
            plant,
            placed.map((entry) => ({
                id: entry.id,
                text: entry.text,
                x: entry.x,
                z: entry.z,
            })),
            anchor
        );

        const gapDays = daysBetween(plant.at, anchorPlant.at);
        const gapScale = 1 + Math.min(gapDays / 45, 3) * 0.42;
        const dx = candidate.x - anchor.x;
        const dz = candidate.z - anchor.z;
        const position = {
            x: anchor.x + dx * gapScale,
            z: anchor.z + dz * gapScale,
            minSpacing: candidate.minSpacing,
        };

        layoutById.set(plant.id, position);
        placed.push({ ...plant, ...position });
    });

    return layoutById;
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

export const FOREST_FIELD_RADIUS = FOREST_RADIUS;

export const sampleForestDensity = (x, z) =>
    forestDensity(x, z, FOREST_DENSITY_SEED);
