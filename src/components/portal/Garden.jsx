import { useCallback, useEffect, useState } from "react";
import GardenSpace from "@/components/garden/GardenSpace";
import {
    GARDEN_PLANTS_UPDATED,
    loadUserLines,
    saveUserLine,
} from "@/api/manifestoGarden";
import styles from "@/styles/Garden.module.scss";

const Garden = () => {
    const [plants, setPlants] = useState(loadUserLines);
    const [draft, setDraft] = useState("");

    const refreshPlants = useCallback(() => {
        setPlants(loadUserLines());
    }, []);

    useEffect(() => {
        const onUpdate = () => refreshPlants();
        window.addEventListener(GARDEN_PLANTS_UPDATED, onUpdate);
        window.addEventListener("storage", onUpdate);
        return () => {
            window.removeEventListener(GARDEN_PLANTS_UPDATED, onUpdate);
            window.removeEventListener("storage", onUpdate);
        };
    }, [refreshPlants]);

    const submitLine = (event) => {
        event.preventDefault();
        const next = saveUserLine(draft);
        setPlants(next);
        setDraft("");
    };

    return (
        <div className={styles.garden}>
            <div className={styles.gardenHeader}>
                <span className={styles.gardenLabel}>digital garden</span>
                <span className={styles.gardenCount}>
                    {plants.length} {plants.length === 1 ? "plant" : "plants"}
                </span>
            </div>

            <GardenSpace plants={plants} />

            <form className={styles.plantForm} onSubmit={submitLine}>
                <label className={styles.plantLabel} htmlFor="garden-plant">
                    plant
                </label>
                <input
                    id="garden-plant"
                    className={styles.plantInput}
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="type a line · it grows here"
                    maxLength={160}
                    autoComplete="off"
                />
            </form>
        </div>
    );
};

export default Garden;
