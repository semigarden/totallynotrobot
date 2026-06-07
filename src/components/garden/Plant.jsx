import { useMemo } from "react";
import { plantWorldScale } from "@/utils/plantBillboard";
import { textToPlant } from "@/utils/lSystem";
import {
    segmentOpacity,
    segmentStrokeWidth,
} from "@/utils/plantDraw";
import styles from "@/styles/VirtualGarden.module.scss";

const Plant = ({ text, seed, label, active = false }) => {
    const plant = useMemo(() => textToPlant(text, seed), [text, seed]);
    const sizeScale = useMemo(
        () => plantWorldScale(text, seed),
        [text, seed]
    );

    return (
        <div
            className={`${styles.plot} ${active ? styles.plotActive : ""}`}
            title={label ?? text}
        >
            <svg
                className={styles.plantSvg}
                viewBox={plant.viewBox}
                style={{
                    transform: `scale(${sizeScale})`,
                    transformOrigin: "50% 100%",
                }}
                role="img"
                aria-label={label ?? `plant grown from: ${text}`}
            >
                {plant.segments.map((segment, index) => (
                    <line
                        key={index}
                        x1={segment.x1}
                        y1={segment.y1}
                        x2={segment.x2}
                        y2={segment.y2}
                        className={styles.stem}
                        style={{
                            strokeWidth: segmentStrokeWidth(segment.depth),
                            opacity: segmentOpacity(segment.depth),
                        }}
                    />
                ))}
            </svg>
            {label && <span className={styles.plotCaption}>{label}</span>}
        </div>
    );
};

export default Plant;
