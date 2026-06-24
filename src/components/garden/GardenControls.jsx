import { useRef, useState } from "react";
import styles from "@/styles/Garden.module.scss";

const GardenControls = ({
    plants = [],
    onPlant,
    onRandomPlant = null,
    onDeleteLastPlant = null,
    showHeader = true,
    showLabel = true,
    showActionButton = false,
    children,
    formClassName = "",
    inputClassName = "",
    actionClassName = "",
    inputId = "garden-plant",
}) => {
    const [draft, setDraft] = useState("");
    const inputRef = useRef(null);

    const plantDraft = () => {
        const trimmed = draft.trim();
        if (!trimmed) return;

        onPlant?.(trimmed);
        setDraft("");
        inputRef.current?.blur();
    };

    const submitLine = (event) => {
        event.preventDefault();
        plantDraft();
    };

    const onInputKeyDown = (event) => {
        if (event.key === "Enter" || event.keyCode === 13) {
            event.preventDefault();
            if (draft.trim()) {
                plantDraft();
            } else {
                onRandomPlant?.();
            }
            return;
        }

        if (event.key === "Backspace" && draft === "" && onDeleteLastPlant) {
            event.preventDefault();
            onDeleteLastPlant();
        }
    };

    const onInputSearch = (event) => {
        event.preventDefault();
        plantDraft();
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
                data-garden-ui="true"
            >
                {showLabel && (
                    <label className={styles.plantLabel} htmlFor={inputId}>
                        plant
                    </label>
                )}
                
                
            </form>
        </>
    );
};

export default GardenControls;
