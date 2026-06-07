import { useState } from "react";
import styles from "@/styles/Garden.module.scss";

const GardenControls = ({
    plants = [],
    onPlant,
    showHeader = true,
    showLabel = true,
    children,
    formClassName = "",
    inputClassName = "",
    inputId = "garden-plant",
}) => {
    const [draft, setDraft] = useState("");

    const submitLine = (event) => {
        event.preventDefault();
        onPlant?.(draft);
        setDraft("");
    };

    return (
        <>
            {showHeader && (
                <div className={styles.gardenHeader}>
                    <span className={styles.gardenLabel}>Gardener</span>
                    <span className={styles.gardenCount}>
                        {plants.length} {plants.length === 1 ? "plant" : "plants"}
                    </span>
                </div>
            )}

            {children}

            <form
                className={`${styles.plantForm} ${formClassName}`.trim()}
                onSubmit={submitLine}
            >
                {showLabel && (
                    <label className={styles.plantLabel} htmlFor={inputId}>
                        plant
                    </label>
                )}
                <input
                    id={inputId}
                    className={`${styles.plantInput} ${inputClassName}`.trim()}
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="type a line · it grows here"
                    maxLength={160}
                    autoComplete="off"
                />
            </form>
        </>
    );
};

export default GardenControls;
