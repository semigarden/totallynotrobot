import { createContext, useContext, useEffect, useState } from "react";
import {
    loadThemePreference,
    migrateLegacyThemePreference,
    saveThemePreference,
} from "@/api/themePreference";

const ThemeContext = createContext(null);

const applyTheme = (isSun) => {
    document.documentElement.dataset.theme = isSun ? "dark" : "light";
};

export const ThemeProvider = ({ children }) => {
    const [isSun, setIsSun] = useState(() => {
        if (typeof window === "undefined") {
            return true;
        }

        applyTheme(true);
        return true;
    });
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const hydrateTheme = async () => {
            const legacy = await migrateLegacyThemePreference();
            const saved = legacy ?? (await loadThemePreference());
            if (cancelled || saved === null) {
                if (!cancelled) setReady(true);
                return;
            }

            const nextIsSun = saved === "dark";
            setIsSun(nextIsSun);
            applyTheme(nextIsSun);
            setReady(true);
        };

        hydrateTheme();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!ready) return;

        applyTheme(isSun);
        saveThemePreference(isSun);
    }, [isSun, ready]);

    const toggleTheme = () => {
        setIsSun((current) => !current);
    };

    return (
        <ThemeContext.Provider value={{ isSun, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }

    return context;
};
