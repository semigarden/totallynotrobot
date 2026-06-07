import { useCallback, useEffect, useState } from "react";
import {
    GARDEN_PLANTS_UPDATED,
    loadUserLines,
    saveUserLine,
} from "@/api/manifestoGarden";

export const useGardenPlants = () => {
    const [plants, setPlants] = useState(loadUserLines);

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

    const plantLine = (text) => {
        const next = saveUserLine(text);
        setPlants(next);
        return next;
    };

    return { plants, plantLine, refreshPlants };
};
