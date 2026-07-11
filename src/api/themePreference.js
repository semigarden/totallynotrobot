import { openAppDb, SETTINGS_STORE } from "@/api/appDb";

const THEME_KEY = "theme";
export const SYNC_STORAGE_KEY = "totallynotrobot-theme";

const isThemeValue = (value) => value === "dark" || value === "light";

export const readSyncThemePreference = () => {
    if (typeof window === "undefined") {
        return null;
    }

    const saved = window.localStorage.getItem(SYNC_STORAGE_KEY);
    return isThemeValue(saved) ? saved : null;
};

export const writeSyncThemePreference = (isSun) => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(SYNC_STORAGE_KEY, isSun ? "dark" : "light");
};

export const loadThemePreference = async () => {
    try {
        const db = await openAppDb();

        return new Promise((resolve) => {
            const transaction = db.transaction(SETTINGS_STORE, "readonly");
            const store = transaction.objectStore(SETTINGS_STORE);
            const request = store.get(THEME_KEY);

            request.onsuccess = () => {
                const saved = request.result;
                resolve(isThemeValue(saved) ? saved : null);
            };
            request.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
};

export const saveThemePreference = async (isSun) => {
    const theme = isSun ? "dark" : "light";
    writeSyncThemePreference(isSun);

    try {
        const db = await openAppDb();

        await new Promise((resolve) => {
            const transaction = db.transaction(SETTINGS_STORE, "readwrite");
            transaction.objectStore(SETTINGS_STORE).put(theme, THEME_KEY);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => resolve();
        });
    } catch {
        // ignore write failures
    }
};

export const migrateLegacyThemePreference = async () => {
    const legacy = readSyncThemePreference();
    if (!legacy) {
        return null;
    }

    await saveThemePreference(legacy !== "light");
    return legacy;
};
