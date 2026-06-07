import GardenBackground from "@/components/garden/GardenBackground";
import ImmersiveChrome from "@/components/portal/ImmersiveChrome";
import { useGardenPlants } from "@/hooks/useGardenPlants";
import styles from "@/styles/ImmersiveLayout.module.scss";

const ImmersiveLayout = () => {
    const { plants, plantLine } = useGardenPlants();

    return (
        <div className={styles.root}>
            <GardenBackground plants={plants} />

            <div className={styles.uiLayer}>
                <ImmersiveChrome plants={plants} onPlant={plantLine} />
            </div>
        </div>
    );
};

export default ImmersiveLayout;
