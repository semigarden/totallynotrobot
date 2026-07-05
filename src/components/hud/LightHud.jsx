import { useTheme } from "@/context/ThemeContext";
import Moon from "@/components/hud/Moon";
import Sun from "@/components/hud/Sun";
import styles from "@/styles/hud/LightHud.module.scss";

const TRANSITION_MS = 900;

const LightHud = ({ className = "" }) => {
    const { isSun, toggleTheme } = useTheme();

    return (
        <div
            className={`${styles.lightHud} ${className}`}
            data-phase={isSun ? "sun" : "moon"}
            style={{ "--light-transition": `${TRANSITION_MS}ms` }}
        >
            <button
                type="button"
                className={styles.stage}
                onClick={toggleTheme}
                aria-label={isSun ? "Switch to light theme" : "Switch to dark theme"}
            >
                <Sun active={isSun} />
                <Moon active={!isSun} />
            </button>
        </div>
    );
};

export default LightHud;
