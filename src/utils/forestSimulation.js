import { buildForestLayout } from "@/utils/plantBillboard";
import { withChunkFields } from "@/utils/gardenChunks";

const SIM_WORDS = [
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
];

export const createSimulationPlants = (count, runSeed = "sim") => {
    const total = Math.max(0, Math.floor(count));
    const basePlants = Array.from({ length: total }, (_, index) => ({
        id: `${runSeed}-${index}`,
        text: SIM_WORDS[index % SIM_WORDS.length],
        at: index,
    }));
    const layout = buildForestLayout(basePlants);

    return basePlants.map((plant, index) =>
        withChunkFields({
            ...plant,
            x: layout[index]?.x ?? 0,
            z: layout[index]?.z ?? 0,
            minSpacing: layout[index]?.minSpacing,
        })
    );
};

export const computeLayoutStats = (layout) => {
    if (!layout.length) {
        return {
            count: 0,
            overlaps: 0,
            minSpacing: 0,
            maxRadius: 0,
            meanRadius: 0,
        };
    }

    let overlaps = 0;
    let minSpacing = Infinity;
    let maxRadius = 0;
    let radiusTotal = 0;

    layout.forEach((position) => {
        const radius = Math.hypot(position.x, position.z);
        maxRadius = Math.max(maxRadius, radius);
        radiusTotal += radius;
    });

    for (let i = 0; i < layout.length; i++) {
        for (let j = i + 1; j < layout.length; j++) {
            const distance = Math.hypot(
                layout[i].x - layout[j].x,
                layout[i].z - layout[j].z
            );
            const required =
                (layout[i].minSpacing + layout[j].minSpacing) / 2;

            minSpacing = Math.min(minSpacing, distance);
            if (distance < required) overlaps += 1;
        }
    }

    return {
        count: layout.length,
        overlaps,
        minSpacing: Number.isFinite(minSpacing) ? minSpacing : 0,
        maxRadius,
        meanRadius: radiusTotal / layout.length,
    };
};
