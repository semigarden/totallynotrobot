import GardenScene from "@/components/garden/GardenScene";
import styles from "@/styles/GardenBackground.module.scss";

const GROUND_CAMERA = {
    offset: { x: 0, y: 1.55, z: 4.5 },
    target: { x: 0, y: 0, z: 0 },
    minDistance: 1.2,
    maxDistance: 28,
};

const GardenBackground = ({ plants = [], onWalkStateChange, gardenActionsRef }) => (
    <GardenScene
        plants={plants}
        className={styles.background}
        canvasClassName={styles.canvas}
        cameraOffset={GROUND_CAMERA.offset}
        cameraTarget={GROUND_CAMERA.target}
        minDistance={GROUND_CAMERA.minDistance}
        maxDistance={GROUND_CAMERA.maxDistance}
        scrollWalk
        walkSpeed={0.005}
        walkNavigation
        wrapMovement
        showPlantTitles={false}
        onWalkStateChange={onWalkStateChange}
        gardenActionsRef={gardenActionsRef}
    />
);

export default GardenBackground;
