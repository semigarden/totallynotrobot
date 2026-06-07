const DB_NAME = "digital-garden";
const DB_VERSION = 1;
const STORE_NAME = "walk-position";
const POSITION_KEY = "immersive";

let dbPromise = null;

const openDb = () => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return dbPromise;
};

export const isWalkPosition = (value) =>
    value &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.z) &&
    Number.isFinite(value.yaw) &&
    Number.isFinite(value.pitch);

export const loadWalkPosition = async () => {
    try {
        const db = await openDb();

        return new Promise((resolve) => {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(POSITION_KEY);

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

export const saveWalkPosition = async (position) => {
    if (!isWalkPosition(position)) return;

    try {
        const db = await openDb();

        await new Promise((resolve) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            store.put(position, POSITION_KEY);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => resolve();
        });
    } catch {
        // Ignore write failures from private mode or blocked storage.
    }
};

export const createWalkPositionSaver = (delay = 450) => {
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
        saveWalkPosition(next);
    };

    const schedule = (position) => {
        if (!isWalkPosition(position)) return;

        latest = position;
        clearTimeout(timer);
        timer = setTimeout(flush, delay);
    };

    return { schedule, flush };
};
