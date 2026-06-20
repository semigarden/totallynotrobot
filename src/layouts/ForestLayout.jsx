import { useCallback, useRef } from "react";
import ForestBackground from "@/components/garden/ForestBackground";
import ForestChrome from "@/components/portal/ForestChrome";
import { useGardenPlants } from "@/hooks/useGardenPlants";
import { useProceduralForest } from "@/hooks/useProceduralForest";
import styles from "@/styles/ImmersiveLayout.module.scss";

const ForestLayout = () => {
    const { plants: authoredPlants, plantLine, plantRandomLine, removeLastPlant } =
        useGardenPlants();
    const { plants, onWalkStateChange } = useProceduralForest(authoredPlants);
    const gardenActionsRef = useRef(null);
    const plantsRef = useRef(plants);
    plantsRef.current = plants;

    const lookAtPlant = useCallback((plant) => {
        if (!plant) return;

        const x = Number.isFinite(plant.x) ? plant.x : 0;
        const z = Number.isFinite(plant.z) ? plant.z : 0;

        requestAnimationFrame(() => {
            gardenActionsRef.current?.lookAt?.(x, 1.15, z);
        });
    }, []);

    const lookAtLatestPlant = useCallback(
        (next) => {
            if (next.length === 0) return;
            lookAtPlant(next[next.length - 1]);
        },
        [lookAtPlant]
    );

    const handlePlant = useCallback(
        (text) => {
            const next = plantLine(text);
            lookAtLatestPlant(next);
        },
        [plantLine, lookAtLatestPlant]
    );

    const handleRandomPlant = useCallback(() => {
        const next = plantRandomLine();
        lookAtLatestPlant(next);
    }, [plantRandomLine, lookAtLatestPlant]);

    const handleDeleteLastPlant = useCallback(() => {
        const current = plantsRef.current;
        if (current.length === 0) return;

        const plant = current[current.length - 1];
        lookAtPlant(plant);
        gardenActionsRef.current?.shrinkPlant?.(plant);

        const next = removeLastPlant();
        plantsRef.current = next;
    }, [lookAtPlant, removeLastPlant]);

    return (
        <div className={styles.root}>
            <ForestBackground
                plants={plants}
                gardenActionsRef={gardenActionsRef}
                onWalkStateChange={onWalkStateChange}
            />

            <div className={styles.uiLayer}>
                <ForestChrome
                    plants={plants}
                    onPlant={handlePlant}
                    onRandomPlant={handleRandomPlant}
                    onDeleteLastPlant={handleDeleteLastPlant}
                />
            </div>
        </div>
    );
};

export default ForestLayout;
