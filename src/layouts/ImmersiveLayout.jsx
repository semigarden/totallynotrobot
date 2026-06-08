import { useCallback, useRef } from "react";
import GardenBackground from "@/components/garden/GardenBackground";
import ImmersiveChrome from "@/components/portal/ImmersiveChrome";
import { useGardenPlants } from "@/hooks/useGardenPlants";
import styles from "@/styles/ImmersiveLayout.module.scss";

const ImmersiveLayout = () => {
    const { plants, plantLine } = useGardenPlants();
    const gardenActionsRef = useRef(null);

    const handlePlant = useCallback(
        (text) => {
            const next = plantLine(text);
            if (next.length === 0) return;

            const plant = next[next.length - 1];
            const x = Number.isFinite(plant.x) ? plant.x : 0;
            const z = Number.isFinite(plant.z) ? plant.z : 0;

            requestAnimationFrame(() => {
                gardenActionsRef.current?.lookAt?.(x, 1.15, z);
            });
        },
        [plantLine]
    );

    return (
        <div className={styles.root}>
            <GardenBackground plants={plants} gardenActionsRef={gardenActionsRef} />

            <div className={styles.uiLayer}>
                <ImmersiveChrome plants={plants} onPlant={handlePlant} />
            </div>
        </div>
    );
};

export default ImmersiveLayout;
