import { useCallback, useEffect, useState } from "react";
import styles from "@/styles/ImmersiveLayout.module.scss";

const FullscreenToggle = ({
    className = "",
    toggleClassName = "",
    iconEnterClassName = "",
    iconExitClassName = "",
}) => {
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
            // ignore unsupported or blocked fullscreen requests
        }
    }, []);

    return (
        <div className={`${styles.fullscreenDock} ${className}`.trim()}>
            <button
                type="button"
                className={`${styles.fullscreenToggle} ${toggleClassName}`.trim()}
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
                {/* <span
                    className={
                        isFullscreen
                            ? `${styles.fullscreenIconExit} ${iconExitClassName}`.trim()
                            : `${styles.fullscreenIconEnter} ${iconEnterClassName}`.trim()
                    }
                    aria-hidden="true"
                /> */}
            </button>
        </div>
    );
};

export default FullscreenToggle;
