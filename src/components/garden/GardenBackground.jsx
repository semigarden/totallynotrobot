import GardenScene from "@/components/garden/GardenScene";
import styles from "@/styles/GardenBackground.module.scss";

const GardenBackground = ({ plants = [] }) => (
    <GardenScene
        plants={plants}
        className={styles.background}
        canvasClassName={styles.canvas}
        cameraOffset={{ x: 0, y: 8, z: 13 }}
    />
);

export default GardenBackground;
