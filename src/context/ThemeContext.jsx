import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "totallynotrobot-theme";

export const ThemeProvider = ({ children }) => {
    const [isSun, setIsSun] = useState(() => {
        if (typeof window === "undefined") {
            return true;
        }

        const sun = window.localStorage.getItem(STORAGE_KEY) !== "light";
        document.documentElement.dataset.theme = sun ? "dark" : "light";
        return sun;
    });

    useEffect(() => {
        const theme = isSun ? "dark" : "light";
        document.documentElement.dataset.theme = theme;
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [isSun]);

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
