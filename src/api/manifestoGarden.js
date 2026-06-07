import {
    buildDateBasedLayout,
    layoutNewPlantByDate,
} from "@/utils/rssToForest";
import { withChunkFields } from "@/utils/gardenChunks";

const STORAGE_KEY = "digital-garden-manifesto";
export const GARDEN_PLANTS_UPDATED = "garden-plants-updated";

const createGardenId = () => {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return `plant-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const readStoredLines = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeUserLines = (lines) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
};

const migrateSpatialLines = (lines) => {
    let changed = false;
    const layoutById = buildDateBasedLayout(lines);
    const next = lines.map((line) => {
        if (Number.isFinite(line?.x) && Number.isFinite(line?.z)) {
            return withChunkFields(line);
        }

        changed = true;
        const position = layoutById.get(line.id) ?? { x: 0, z: 0 };
        return withChunkFields({
            ...line,
            x: position.x,
            z: position.z,
        });
    });

    return { lines: next, changed };
};

export const loadUserLines = () => {
    const storedLines = readStoredLines();
    const { lines, changed } = migrateSpatialLines(storedLines);

    if (changed) {
        try {
            writeUserLines(lines);
        } catch {
            return lines;
        }
    }

    return lines;
};

export const saveUserLine = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return loadUserLines();

    try {
        const currentLines = loadUserLines();
        const entry = {
            id: createGardenId(),
            text: trimmed,
            at: Date.now(),
        };
        const position = layoutNewPlantByDate(entry, currentLines);
        const spatialEntry = withChunkFields({
            ...entry,
            x: position.x,
            z: position.z,
        });

        const next = [...currentLines, spatialEntry];
        writeUserLines(next);
        window.dispatchEvent(new Event(GARDEN_PLANTS_UPDATED));
        return next;
    } catch {
        return loadUserLines();
    }
};

export const buildGardenDialogue = (opening, userLines, acknowledgments) => {
    const dialogue = [...opening];

    userLines.forEach((entry, index) => {
        dialogue.push({ voice: "user", text: entry.text });
        dialogue.push({
            voice: "app",
            text: acknowledgments[index % acknowledgments.length],
        });
    });

    return dialogue;
};
