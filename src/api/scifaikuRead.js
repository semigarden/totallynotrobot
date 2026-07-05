const STORAGE_KEY = "totallynotrobot-read-scifaiku";

export const loadReadHaikuIndices = () => {
    if (typeof window === "undefined") {
        return new Set();
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
        return new Set();
    }
};

export const saveReadHaikuIndices = (indices) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...indices]));
};

export const markHaikuRead = (readSet, index) => {
    const next = new Set(readSet);
    next.add(index);
    saveReadHaikuIndices(next);
    return next;
};

export const clearReadHaikuIndices = () => {
    if (typeof window === "undefined") return new Set();
    window.localStorage.removeItem(STORAGE_KEY);
    return new Set();
};
