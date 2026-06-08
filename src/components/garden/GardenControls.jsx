import { useRef, useState } from "react";
import styles from "@/styles/Garden.module.scss";

const GardenControls = ({
    plants = [],
    onPlant,
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
        if (event.key !== "Enter" && event.keyCode !== 13) return;

        event.preventDefault();
        plantDraft();
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
                <input
                    ref={inputRef}
                    id={inputId}
                    className={`${styles.plantInput} ${inputClassName}`.trim()}
                    type={showActionButton ? "search" : "text"}
                    name="plant"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={onInputKeyDown}
                    onSearch={onInputSearch}
                    placeholder="type a line"
                    maxLength={160}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="sentences"
                    enterKeyHint="go"
                    inputMode="text"
                />
                {/* {showActionButton ? (
                    <button
                        type="submit"
                        className={`${styles.plantAction} ${actionClassName}`.trim()}
                    >
                        Grow
                    </button>
                ) : (
                    <button type="submit" className={styles.plantSubmit}>
                        Plant
                    </button>
                )} */}
            </form>
        </>
    );
};

export default GardenControls;
