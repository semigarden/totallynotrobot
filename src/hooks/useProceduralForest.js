import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ensureVisibleProceduralChunks,
    mergeProceduralPlants,
    PROCEDURAL_FOREST_SEED,
} from "@/utils/proceduralForest";
import { DEFAULT_VISIBLE_CHUNK_RADIUS } from "@/utils/gardenChunks";

export const useProceduralForest = (
    authoredPlants = [],
    {
        worldSeed = PROCEDURAL_FOREST_SEED,
        chunkRadius = DEFAULT_VISIBLE_CHUNK_RADIUS,
    } = {}
) => {
    const chunkCacheRef = useRef(new Map());
    const loadedKeysRef = useRef(new Set());
    const [proceduralPlants, setProceduralPlants] = useState([]);

    const syncVisibleChunks = useCallback(
        (position = { x: 0, z: 0 }) => {
            const { changed, proceduralPlants: nextProceduralPlants } =
                ensureVisibleProceduralChunks(position, {
                    authoredPlants,
                    chunkCache: chunkCacheRef.current,
                    loadedKeys: loadedKeysRef.current,
                    chunkRadius,
                    worldSeed,
                });

            if (changed) {
                setProceduralPlants(nextProceduralPlants);
            }
        },
        [authoredPlants, chunkRadius, worldSeed]
    );

    useEffect(() => {
        syncVisibleChunks({ x: 0, z: 0 });
    }, [syncVisibleChunks]);

    const onWalkStateChange = useCallback(
        (state) => {
            syncVisibleChunks(state);
        },
        [syncVisibleChunks]
    );

    const plants = useMemo(
        () => mergeProceduralPlants(authoredPlants, proceduralPlants),
        [authoredPlants, proceduralPlants]
    );

    return { plants, onWalkStateChange };
};
