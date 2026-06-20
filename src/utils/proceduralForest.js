import { hashString } from "@/utils/lSystem";
import {
    CHUNK_SIZE,
    parseChunkKey,
    visibleChunkKeys,
    withChunkFields,
    DEFAULT_VISIBLE_CHUNK_RADIUS,
} from "@/utils/gardenChunks";
import {
    minSpacingForPlant,
    sampleUnboundedForestDensity,
} from "@/utils/plantBillboard";

export const PROCEDURAL_FOREST_SEED = "infinite-forest-v1";
export const PROCEDURAL_DENSITY_THRESHOLD = 0.34;
export const PROCEDURAL_CELLS_PER_SIDE = 6;

const FOREST_WORDS = [
    "forest",
    "memory",
    "signal",
    "root",
    "branch",
    "echo",
    "garden",
    "moon",
    "river",
    "stone",
    "light",
    "shadow",
    "growth",
    "pattern",
    "quiet",
    "bloom",
    "path",
    "wind",
    "seed",
    "canopy",
    "moss",
    "fern",
    "trail",
    "mist",
];

const hashUnit = (key) => hashString(key) / 0xffffffff;

export const proceduralPlantId = (chunkX, chunkZ, cellX, cellZ) =>
    `proc:${chunkX}:${chunkZ}:${cellX}:${cellZ}`;

export const proceduralPlantText = (plantId, worldSeed = PROCEDURAL_FOREST_SEED) => {
    const hash = hashString(`${worldSeed}:text:${plantId}`);
    const wordA = FOREST_WORDS[hash % FOREST_WORDS.length];
    const wordB = FOREST_WORDS[(hash >> 8) % FOREST_WORDS.length];
    const wordC = FOREST_WORDS[(hash >> 16) % FOREST_WORDS.length];

    if (hash % 5 === 0) {
        return `${wordA} ${wordB}`;
    }

    if (hash % 3 === 0) {
        return `${wordA} ${wordC} ${wordB}`;
    }

    return wordA;
};

const hasSpacingConflict = (x, z, plant, existingPlants = []) => {
    const requiredSpacing = minSpacingForPlant(plant);

    for (const existing of existingPlants) {
        if (!Number.isFinite(existing?.x) || !Number.isFinite(existing?.z)) {
            continue;
        }

        const required =
            (requiredSpacing + minSpacingForPlant(existing)) / 2;
        const distance = Math.hypot(x - existing.x, z - existing.z);

        if (distance < required) {
            return true;
        }
    }

    return false;
};

export const collectNearbyPlants = (
    plants = [],
    chunkX,
    chunkZ,
    marginChunks = 1
) =>
    plants.filter((plant) => {
        if (!Number.isFinite(plant?.chunkX) || !Number.isFinite(plant?.chunkZ)) {
            return false;
        }

        return (
            Math.abs(plant.chunkX - chunkX) <= marginChunks &&
            Math.abs(plant.chunkZ - chunkZ) <= marginChunks
        );
    });

export const generateChunkPlants = (
    chunkX,
    chunkZ,
    existingPlants = [],
    {
        worldSeed = PROCEDURAL_FOREST_SEED,
        densityThreshold = PROCEDURAL_DENSITY_THRESHOLD,
        cellsPerSide = PROCEDURAL_CELLS_PER_SIDE,
    } = {}
) => {
    const chunkMinX = chunkX * CHUNK_SIZE;
    const chunkMinZ = chunkZ * CHUNK_SIZE;
    const cellSize = CHUNK_SIZE / cellsPerSide;
    const generated = [];

    for (let cellZ = 0; cellZ < cellsPerSide; cellZ++) {
        for (let cellX = 0; cellX < cellsPerSide; cellX++) {
            const baseX = chunkMinX + (cellX + 0.5) * cellSize;
            const baseZ = chunkMinZ + (cellZ + 0.5) * cellSize;
            const cellHash = hashString(
                `${worldSeed}:cell:${chunkX}:${chunkZ}:${cellX}:${cellZ}`
            );
            const jitterX =
                ((cellHash & 0xffff) / 0xffff - 0.5) * cellSize * 0.72;
            const jitterZ =
                (((cellHash >> 16) & 0xffff) / 0xffff - 0.5) * cellSize * 0.72;
            const x = baseX + jitterX;
            const z = baseZ + jitterZ;
            const density = sampleUnboundedForestDensity(x, z, worldSeed);

            if (density < densityThreshold) continue;

            const spawnRoll = hashUnit(
                `${worldSeed}:spawn:${chunkX}:${chunkZ}:${cellX}:${cellZ}`
            );
            if (spawnRoll > density * 0.92 + 0.08) continue;

            const id = proceduralPlantId(chunkX, chunkZ, cellX, cellZ);
            const plant = {
                id,
                text: proceduralPlantText(id, worldSeed),
                at: cellHash,
                procedural: true,
            };

            const spacingContext = [...existingPlants, ...generated];
            if (hasSpacingConflict(x, z, plant, spacingContext)) continue;

            generated.push(
                withChunkFields({
                    ...plant,
                    x,
                    z,
                })
            );
        }
    }

    return generated;
};

export const mergeProceduralPlants = (authoredPlants = [], proceduralPlants = []) => {
    const authored = authoredPlants.filter((plant) => plant?.text);
    const procedural = proceduralPlants.filter(
        (plant) => plant?.text && plant?.procedural
    );
    return [...authored, ...procedural];
};

export const ensureVisibleProceduralChunks = (
    position = { x: 0, z: 0 },
    {
        authoredPlants = [],
        chunkCache = new Map(),
        loadedKeys = new Set(),
        chunkRadius = DEFAULT_VISIBLE_CHUNK_RADIUS,
        worldSeed = PROCEDURAL_FOREST_SEED,
    } = {}
) => {
    const visible = visibleChunkKeys(position, chunkRadius);
    let changed = false;

    const getCachedPlants = () => {
        const cached = [];
        chunkCache.forEach((plants) => cached.push(...plants));
        return cached;
    };

    visible.forEach((key) => {
        if (loadedKeys.has(key)) return;

        loadedKeys.add(key);
        changed = true;

        const { chunkX, chunkZ } = parseChunkKey(key);
        const nearby = collectNearbyPlants(
            [...authoredPlants, ...getCachedPlants()],
            chunkX,
            chunkZ
        );
        const generated = generateChunkPlants(chunkX, chunkZ, nearby, {
            worldSeed,
        });
        chunkCache.set(key, generated);
    });

    const proceduralPlants = [];
    chunkCache.forEach((plants) => proceduralPlants.push(...plants));

    return { changed, proceduralPlants };
};
