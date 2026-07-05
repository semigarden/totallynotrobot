import { useState } from "react";
import Moon from "@/components/hud/Moon";
import Sun from "@/components/hud/Sun";
import styles from "@/styles/hud/LightHud.module.scss";

const TRANSITION_MS = 900;

const LightHud = ({ className = "" }) => {
    const [isSun, setIsSun] = useState(true);

    const togglePhase = () => {
        setIsSun((current) => !current);
    };

    return (
        <div
            className={`${styles.lightHud} ${className}`}
            data-phase={isSun ? "sun" : "moon"}
            style={{ "--light-transition": `${TRANSITION_MS}ms` }}
        >
            <button
                type="button"
                className={styles.stage}
                onClick={togglePhase}
                aria-label={isSun ? "Switch to moon" : "Switch to sun"}
            >
                <Sun active={isSun} />
                <Moon active={!isSun} />
            </button>
        </div>
    );
};

export default LightHud;
