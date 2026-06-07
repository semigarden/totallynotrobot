import GardenControls from "@/components/garden/GardenControls";
import GardenSpace from "@/components/garden/GardenSpace";
import { useGardenPlants } from "@/hooks/useGardenPlants";
import styles from "@/styles/Garden.module.scss";

const Garden = () => {
    const { plants, plantLine } = useGardenPlants();

    return (
        <div className={styles.garden}>
            <GardenControls plants={plants} onPlant={plantLine}>
                <GardenSpace plants={plants} />
            </GardenControls>
        </div>
    );
};

export default Garden;
