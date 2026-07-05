import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import Moon from "@/components/hud/Moon";
import Sun from "@/components/hud/Sun";
import styles from "@/styles/hud/LightHud.module.scss";

const TRANSITION_MS = 900;
const ASSEMBLE_MS = 1220;
const IDLE_SETTLE_MS = 180;

const LightHud = ({ className = "", animate = true }) => {
    const { isSun, toggleTheme } = useTheme();
    const [assembling, setAssembling] = useState(animate);
    const [settling, setSettling] = useState(false);

    useEffect(() => {
        if (!animate) {
            setAssembling(false);
            setSettling(false);
            return;
        }

        setAssembling(true);
        setSettling(false);

        const assembleTimer = window.setTimeout(() => {
            setAssembling(false);
            setSettling(true);
        }, ASSEMBLE_MS);

        const settleTimer = window.setTimeout(() => {
            setSettling(false);
        }, ASSEMBLE_MS + IDLE_SETTLE_MS);

        return () => {
            window.clearTimeout(assembleTimer);
            window.clearTimeout(settleTimer);
        };
    }, [animate]);

    return (
        <div
            className={`${styles.lightHud} ${assembling ? styles.assembling : ""} ${settling ? styles.settling : ""} ${className}`}
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
