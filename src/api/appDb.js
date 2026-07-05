const DB_NAME = "digital-garden";
const DB_VERSION = 2;

export const WALK_STORE = "walk-position";
export const SETTINGS_STORE = "settings";

let dbPromise = null;

export const openAppDb = () => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(WALK_STORE)) {
                db.createObjectStore(WALK_STORE);
            }

            if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                db.createObjectStore(SETTINGS_STORE);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return dbPromise;
};
