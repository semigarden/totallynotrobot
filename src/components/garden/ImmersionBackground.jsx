import GardenScene from "@/components/garden/GardenScene";
import { computeMoonFramedLookTarget } from "@/utils/moonScene";
import styles from "@/styles/GardenBackground.module.scss";

const GROUND_CAMERA = {
    offset: { x: 0, y: 1.55, z: 4.5 },
    target: { x: 0, y: 0, z: 0 },
    minDistance: 1.2,
    maxDistance: 28,
};

const FRESH_SPAWN_LOOK = computeMoonFramedLookTarget(GROUND_CAMERA.offset);

const ImmersionBackground = ({
    plants = [],
    onWalkStateChange,
    gardenActionsRef,
}) => (
    <GardenScene
        plants={plants}
        className={styles.background}
        canvasClassName={styles.canvas}
        cameraOffset={GROUND_CAMERA.offset}
        cameraTarget={GROUND_CAMERA.target}
        freshSpawnLookTarget={FRESH_SPAWN_LOOK}
        minDistance={GROUND_CAMERA.minDistance}
        maxDistance={GROUND_CAMERA.maxDistance}
        scrollWalk
        walkSpeed={0.005}
        walkNavigation
        walkPositionKey="immersion"
        wrapMovement
        showPlantTitles={false}
        showClouds
        onWalkStateChange={onWalkStateChange}
        gardenActionsRef={gardenActionsRef}
    />
);

export default ImmersionBackground;
