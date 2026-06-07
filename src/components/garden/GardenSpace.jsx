import GardenScene from "@/components/garden/GardenScene";
import styles from "@/styles/Garden.module.scss";

const GardenSpace = ({ plants = [] }) => (
    <GardenScene
        plants={plants}
        className={styles.space}
        canvasClassName={styles.canvas}
        showPlantTitles={false}
    />
);

export default GardenSpace;
