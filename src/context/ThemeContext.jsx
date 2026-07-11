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

const readInitialIsSun = () => {
    if (typeof window === "undefined") {
        return true;
    }

    return document.documentElement.dataset.theme !== "light";
};

const waitForPaint = () =>
    new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

export const ThemeProvider = ({ children }) => {
    const [isSun, setIsSun] = useState(readInitialIsSun);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const hydrateTheme = async () => {
            const legacy = await migrateLegacyThemePreference();
            const saved = legacy ?? (await loadThemePreference());

            if (cancelled) {
                return;
            }

            if (saved === null) {
                setReady(true);
                return;
            }

            const nextIsSun = saved === "dark";
            const currentIsSun = document.documentElement.dataset.theme !== "light";

            if (nextIsSun !== currentIsSun) {
                await waitForPaint();

                if (cancelled) {
                    return;
                }

                setIsSun(nextIsSun);
                applyTheme(nextIsSun);
            }

            setReady(true);
        };

        hydrateTheme();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!ready) {
            return;
        }

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
