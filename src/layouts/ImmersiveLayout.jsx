import { useCallback, useEffect, useRef } from "react";
import GardenBackground from "@/components/garden/GardenBackground";
import ImmersiveChrome from "@/components/portal/ImmersiveChrome";
import { useGardenPlants } from "@/hooks/useGardenPlants";
import styles from "@/styles/ImmersiveLayout.module.scss";

const isEditableTarget = (target) => {
    if (!(target instanceof HTMLElement)) return false;

    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return true;
    }

    return target.isContentEditable;
};

const ImmersiveLayout = () => {
    const { plants, plantLine, plantRandomLine, removeLastPlant } =
        useGardenPlants();
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

    useEffect(() => {
        const onKeyDown = (event) => {
            const target = event.target;

            if (
                target instanceof HTMLInputElement &&
                target.id === "immerse-plant"
            ) {
                return;
            }

            if (event.key === "Enter") {
                if (isEditableTarget(target)) return;

                event.preventDefault();
                handleRandomPlant();
                return;
            }

            if (event.key !== "Backspace") return;
            if (isEditableTarget(target)) return;

            event.preventDefault();
            handleDeleteLastPlant();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [handleRandomPlant, handleDeleteLastPlant]);

    return (
        <div className={styles.root}>
            <GardenBackground plants={plants} gardenActionsRef={gardenActionsRef} />

            <div className={styles.uiLayer}>
                <ImmersiveChrome
                    plants={plants}
                    onPlant={handlePlant}
                    onRandomPlant={handleRandomPlant}
                    onDeleteLastPlant={handleDeleteLastPlant}
                />
            </div>
        </div>
    );
};

export default ImmersiveLayout;
