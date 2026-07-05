import { openAppDb, SETTINGS_STORE } from "@/api/appDb";

const THEME_KEY = "theme";
const LEGACY_STORAGE_KEY = "totallynotrobot-theme";

const isThemeValue = (value) => value === "dark" || value === "light";

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
    if (typeof window === "undefined") return null;

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!isThemeValue(legacy)) return null;

    await saveThemePreference(legacy !== "light");
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return legacy;
};
