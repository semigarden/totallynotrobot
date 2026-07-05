import { openAppDb, WALK_STORE } from "@/api/appDb";

const DEFAULT_POSITION_KEY = "immersive";

export const isWalkPosition = (value) =>
    value &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.z) &&
    Number.isFinite(value.yaw) &&
    Number.isFinite(value.pitch);

export const loadWalkPosition = async (
    positionKey = DEFAULT_POSITION_KEY
) => {
    try {
        const db = await openAppDb();

        return new Promise((resolve) => {
            const transaction = db.transaction(WALK_STORE, "readonly");
            const store = transaction.objectStore(WALK_STORE);
            const request = store.get(positionKey);

            request.onsuccess = () => {
                const saved = request.result ?? null;
                resolve(isWalkPosition(saved) ? saved : null);
            };
            request.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
};

export const saveWalkPosition = async (
    position,
    positionKey = DEFAULT_POSITION_KEY
) => {
    if (!isWalkPosition(position)) return;

    try {
        const db = await openAppDb();

        await new Promise((resolve) => {
            const transaction = db.transaction(WALK_STORE, "readwrite");
            const store = transaction.objectStore(WALK_STORE);
            store.put(position, positionKey);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => resolve();
        });
    } catch {

    }
};

export const createWalkPositionSaver = (
    delay = 450,
    positionKey = DEFAULT_POSITION_KEY
) => {
    let timer = null;
    let latest = null;

    const flush = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }

        if (!latest) return;

        const next = latest;
        latest = null;
        saveWalkPosition(next, positionKey);
    };

    const schedule = (position) => {
        if (!isWalkPosition(position)) return;

        latest = position;
        clearTimeout(timer);
        timer = setTimeout(flush, delay);
    };

    return { schedule, flush };
};
