import { useCallback, useEffect, useMemo, useState } from "react";
import { buildGardensFromLocalFeed } from "@/api/rssGarden";
import {
    computeGardenCentroids,
    gardensToForestPlants,
} from "@/utils/rssToForest";

export const useWebGardens = () => {
    const [gardenList, setGardenList] = useState([]);
    const [feedResults, setFeedResults] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshGardens = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { gardens, feedResults: nextFeeds } =
                buildGardensFromLocalFeed();
            setGardenList(gardens);
            setFeedResults(nextFeeds);
        } catch (refreshError) {
            setError(
                refreshError instanceof Error
                    ? refreshError.message
                    : "Unable to sync gardens"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshGardens();
    }, [refreshGardens]);

    const plants = useMemo(
        () => gardensToForestPlants(gardenList, feedResults),
        [gardenList, feedResults]
    );

    const gardens = useMemo(
        () =>
            computeGardenCentroids(gardenList, plants).map((garden) => ({
                ...garden,
                feed: feedResults[garden.id] ?? null,
                itemCount: feedResults[garden.id]?.items?.length ?? 0,
                totalAvailable: feedResults[garden.id]?.totalAvailable ?? 0,
            })),
        [gardenList, feedResults, plants]
    );

    return {
        gardens,
        plants,
        loading,
        error,
        refreshGardens,
    };
};
