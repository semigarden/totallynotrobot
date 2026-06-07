const STORAGE_KEY = "digital-garden-manifesto";
export const GARDEN_PLANTS_UPDATED = "garden-plants-updated";

const createGardenId = () => {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return `plant-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const loadUserLines = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const saveUserLine = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return loadUserLines();

    try {
        const entry = {
            id: createGardenId(),
            text: trimmed,
            at: Date.now(),
        };

        const next = [...loadUserLines(), entry];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
