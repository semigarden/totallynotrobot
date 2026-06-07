import { useCallback, useEffect, useState } from "react";
import styles from "@/styles/ImmersiveLayout.module.scss";

const FullscreenToggle = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const onChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);

    const toggleFullscreen = useCallback(async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await document.documentElement.requestFullscreen();
            }
        } catch {
            // Fullscreen may be blocked by the browser or user settings.
        }
    }, []);

    return (
        <div className={styles.fullscreenDock}>
            <button
                type="button"
                className={styles.fullscreenToggle}
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
                <span
                    className={
                        isFullscreen
                            ? styles.fullscreenIconExit
                            : styles.fullscreenIconEnter
                    }
                    aria-hidden="true"
                />
            </button>
        </div>
    );
};

export default FullscreenToggle;
