import { useMemo } from "react";
import GardenScene from "@/components/garden/GardenScene";
import {
    getImmersionLeftWallSpawn,
    getImmersionMovementBounds,
    getImmersionMoonPosition,
    IMMERSION_ENTRANCE_DEFAULTS,
    IMMERSION_PLANT_SCALE,
    layoutImmersionPlants,
} from "@/utils/immersionEntrance";
import styles from "@/styles/GardenBackground.module.scss";

const IMMERSION_SPAWN = getImmersionLeftWallSpawn();
const IMMERSION_MOON_POSITION = getImmersionMoonPosition();
const IMMERSION_MOVEMENT_BOUNDS = getImmersionMovementBounds();

const ImmersionBackground = ({
    plants = [],
    onWalkStateChange,
    gardenActionsRef,
}) => {
    const scenePlants = useMemo(
        () => layoutImmersionPlants(plants),
        [plants]
    );

    return (
        <GardenScene
            plants={scenePlants}
            className={styles.background}
            canvasClassName={styles.canvas}
            cameraOffset={IMMERSION_SPAWN.offset}
            cameraTarget={IMMERSION_SPAWN.target}
            freshSpawnLookTarget={IMMERSION_SPAWN.target}
            minDistance={1.2}
            maxDistance={28}
            scrollWalk
            walkSpeed={0.005}
            walkNavigation
            walkPositionKey="immersion-entrance"
            movementBounds={IMMERSION_MOVEMENT_BOUNDS}
            wrapMovement={false}
            showPlantTitles={false}
            showClouds
            showEntrance
            moonPosition={IMMERSION_MOON_POSITION}
            moonLightTarget={IMMERSION_ENTRANCE_DEFAULTS.position}
            cloudAnchor={IMMERSION_MOON_POSITION}
            cloudFollowCamera={false}
            plantScaleMultiplier={IMMERSION_PLANT_SCALE}
            visibleChunkRadius={3}
            onWalkStateChange={onWalkStateChange}
            gardenActionsRef={gardenActionsRef}
        />
    );
};

export default ImmersionBackground;
