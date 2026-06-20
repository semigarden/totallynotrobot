import { hashString } from "@/utils/lSystem";
import {
    CHUNK_SIZE,
    chunkCoord,
    chunkKey,
    parseChunkKey,
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
export const PROCEDURAL_PREFETCH_RADIUS = 1;
export const PROCEDURAL_CACHE_RADIUS = DEFAULT_VISIBLE_CHUNK_RADIUS + 2;

export const DEFAULT_PROCEDURAL_FOREST_CONFIG = {
    worldSeed: PROCEDURAL_FOREST_SEED,
    visibleRadius: DEFAULT_VISIBLE_CHUNK_RADIUS,
    prefetchRadius: PROCEDURAL_PREFETCH_RADIUS,
    cacheRadius: PROCEDURAL_CACHE_RADIUS,
    densityThreshold: PROCEDURAL_DENSITY_THRESHOLD,
    cellsPerSide: PROCEDURAL_CELLS_PER_SIDE,
    trackPlantMotion: false,
};

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

const keysInRadius = (centerX, centerZ, radius) => {
    const keys = [];

    for (let z = centerZ - radius; z <= centerZ + radius; z++) {
        for (let x = centerX - radius; x <= centerX + radius; x++) {
            keys.push(chunkKey(x, z));
        }
    }

    return keys;
};

const createPlantSpatialIndex = () => {
    const byChunk = new Map();

    const addPlants = (plants = []) => {
        plants.forEach((plant) => {
            if (!Number.isFinite(plant?.chunkX) || !Number.isFinite(plant?.chunkZ)) {
                return;
            }

            const key = chunkKey(plant.chunkX, plant.chunkZ);
            const group = byChunk.get(key) ?? [];
            group.push(plant);
            byChunk.set(key, group);
        });
    };

    const setChunk = (key, plants = []) => {
        if (plants.length === 0) {
            byChunk.delete(key);
            return;
        }

        byChunk.set(key, plants);
    };

    const removeChunk = (key) => {
        byChunk.delete(key);
    };

    const queryNearby = (chunkX, chunkZ, marginChunks = 1) => {
        const results = [];

        for (let z = chunkZ - marginChunks; z <= chunkZ + marginChunks; z++) {
            for (let x = chunkX - marginChunks; x <= chunkX + marginChunks; x++) {
                results.push(...(byChunk.get(chunkKey(x, z)) ?? []));
            }
        }

        return results;
    };

    const clear = () => {
        byChunk.clear();
    };

    return { addPlants, setChunk, removeChunk, queryNearby, clear };
};

export const proceduralPlantId = (chunkX, chunkZ, cellX, cellZ) =>
    `proc:${chunkX}:${chunkZ}:${cellX}:${cellZ}`;

export const proceduralPlantText = (
    plantId,
    worldSeed = PROCEDURAL_FOREST_SEED
) => {
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

export const createProceduralForestManager = (config = {}) => {
    const settings = { ...DEFAULT_PROCEDURAL_FOREST_CONFIG, ...config };
    const chunkCache = new Map();
    const spatialIndex = createPlantSpatialIndex();
    let prefetchHandle = null;
    let lastCenterKey = null;
    let onChunksChanged = null;

    const loadChunk = (chunkX, chunkZ, authoredPlants = []) => {
        const key = chunkKey(chunkX, chunkZ);
        if (chunkCache.has(key)) {
            return chunkCache.get(key);
        }

        const nearby = [
            ...collectNearbyPlants(authoredPlants, chunkX, chunkZ, 1),
            ...spatialIndex.queryNearby(chunkX, chunkZ, 1),
        ];
        const generated = generateChunkPlants(chunkX, chunkZ, nearby, {
            worldSeed: settings.worldSeed,
            densityThreshold: settings.densityThreshold,
            cellsPerSide: settings.cellsPerSide,
        });

        chunkCache.set(key, generated);
        spatialIndex.setChunk(key, generated);
        return generated;
    };

    const prune = (centerX, centerZ) => {
        chunkCache.forEach((_, key) => {
            const { chunkX, chunkZ } = parseChunkKey(key);
            if (
                Math.abs(chunkX - centerX) <= settings.cacheRadius &&
                Math.abs(chunkZ - centerZ) <= settings.cacheRadius
            ) {
                return;
            }

            chunkCache.delete(key);
            spatialIndex.removeChunk(key);
        });
    };

    const schedulePrefetch = (centerX, centerZ, authoredPlants = []) => {
        const outerRadius = settings.visibleRadius + settings.prefetchRadius;
        const keysToPrefetch = keysInRadius(centerX, centerZ, outerRadius).filter(
            (key) => {
                if (chunkCache.has(key)) return false;

                const { chunkX, chunkZ } = parseChunkKey(key);
                return (
                    Math.abs(chunkX - centerX) > settings.visibleRadius ||
                    Math.abs(chunkZ - centerZ) > settings.visibleRadius
                );
            }
        );

        if (prefetchHandle !== null) {
            cancelIdleCallback(prefetchHandle);
            prefetchHandle = null;
        }

        if (keysToPrefetch.length === 0) return;

        let index = 0;

        const processNext = (deadline) => {
            while (
                index < keysToPrefetch.length &&
                (deadline?.timeRemaining?.() ?? 8) > 1
            ) {
                const { chunkX, chunkZ } = parseChunkKey(keysToPrefetch[index]);
                index += 1;
                loadChunk(chunkX, chunkZ, authoredPlants);
            }

            if (index < keysToPrefetch.length) {
                prefetchHandle = requestIdleCallback(processNext, { timeout: 120 });
                return;
            }

            prefetchHandle = null;
            onChunksChanged?.();
        };

        prefetchHandle = requestIdleCallback(processNext, { timeout: 120 });
    };

    const sync = (position = { x: 0, z: 0 }, authoredPlants = []) => {
        const centerX = chunkCoord(position.x ?? 0);
        const centerZ = chunkCoord(position.z ?? 0);
        const centerKey = chunkKey(centerX, centerZ);
        const centerChanged = centerKey !== lastCenterKey;
        lastCenterKey = centerKey;

        let loadedNew = false;

        keysInRadius(centerX, centerZ, settings.visibleRadius).forEach((key) => {
            if (chunkCache.has(key)) return;

            const { chunkX, chunkZ } = parseChunkKey(key);
            loadChunk(chunkX, chunkZ, authoredPlants);
            loadedNew = true;
        });

        prune(centerX, centerZ);

        if (centerChanged || loadedNew) {
            schedulePrefetch(centerX, centerZ, authoredPlants);
        }

        return centerChanged || loadedNew;
    };

    const getChunkPlants = (key) => chunkCache.get(key) ?? [];

    const setOnChunksChanged = (callback) => {
        onChunksChanged = callback;
    };

    const dispose = () => {
        if (prefetchHandle !== null) {
            cancelIdleCallback(prefetchHandle);
            prefetchHandle = null;
        }

        chunkCache.clear();
        spatialIndex.clear();
        lastCenterKey = null;
        onChunksChanged = null;
    };

    return {
        sync,
        getChunkPlants,
        loadChunk,
        setOnChunksChanged,
        dispose,
        settings,
    };
};
