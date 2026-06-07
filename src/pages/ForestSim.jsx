import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import GardenScene from "@/components/garden/GardenScene";
import ForestSimMap from "@/components/garden/ForestSimMap";
import {
    computeLayoutStats,
    createSimulationPlants,
} from "@/utils/forestSimulation";
import styles from "@/styles/ForestSim.module.scss";

const OVERVIEW_CAMERA = {
    offset: { x: 0, y: 24, z: 24 },
    target: { x: 0, y: 0, z: 0 },
    minDistance: 8,
    maxDistance: 64,
};

const ForestSim = () => {
    const [targetCount, setTargetCount] = useState(48);
    const [visibleCount, setVisibleCount] = useState(48);
    const [runSeed, setRunSeed] = useState("sim-a");
    const [playing, setPlaying] = useState(false);
    const [stepMs, setStepMs] = useState(180);

    const allPlants = useMemo(
        () => createSimulationPlants(targetCount, runSeed),
        [targetCount, runSeed]
    );
    const plants = useMemo(
        () => allPlants.slice(0, visibleCount),
        [allPlants, visibleCount]
    );
    const layout = useMemo(
        () =>
            plants.map((plant) => ({
                x: plant.x,
                z: plant.z,
                minSpacing: plant.minSpacing,
            })),
        [plants]
    );
    const stats = useMemo(() => computeLayoutStats(layout), [layout]);

    useEffect(() => {
        if (!playing) return undefined;

        if (visibleCount >= targetCount) {
            setPlaying(false);
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setVisibleCount((count) => Math.min(count + 1, targetCount));
        }, stepMs);

        return () => window.clearTimeout(timer);
    }, [playing, visibleCount, targetCount, stepMs]);

    const regenerate = () => {
        const nextSeed = `sim-${Date.now().toString(36)}`;
        setRunSeed(nextSeed);
        setVisibleCount(1);
        setPlaying(false);
    };

    const resetGrowth = () => {
        setVisibleCount(1);
        setPlaying(false);
    };

    const showAll = () => {
        setVisibleCount(targetCount);
        setPlaying(false);
    };

    return (
        <div className={styles.root}>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>Forest placement simulation</p>
                    <h1 className={styles.title}>/sim</h1>
                </div>
                <Link className={styles.backLink} to="/">
                    Back to garden
                </Link>
            </header>

            <section className={styles.controls}>
                <label className={styles.control}>
                    <span>Target trees: {targetCount}</span>
                    <input
                        type="range"
                        min="1"
                        max="120"
                        value={targetCount}
                        onChange={(event) => {
                            const next = Number(event.target.value);
                            setTargetCount(next);
                            setVisibleCount((count) => Math.min(count, next));
                        }}
                    />
                </label>

                <label className={styles.control}>
                    <span>Growth step: {stepMs}ms</span>
                    <input
                        type="range"
                        min="60"
                        max="600"
                        step="20"
                        value={stepMs}
                        onChange={(event) => setStepMs(Number(event.target.value))}
                    />
                </label>

                <div className={styles.buttons}>
                    <button
                        type="button"
                        onClick={() => setPlaying((value) => !value)}
                    >
                        {playing ? "Pause" : "Play growth"}
                    </button>
                    <button type="button" onClick={resetGrowth}>
                        Reset to 1
                    </button>
                    <button type="button" onClick={showAll}>
                        Show all
                    </button>
                    <button type="button" onClick={regenerate}>
                        New seed
                    </button>
                </div>
            </section>

            <section className={styles.stats}>
                <div>
                    <span>Visible</span>
                    <strong>
                        {stats.count}/{targetCount}
                    </strong>
                </div>
                <div>
                    <span>Overlaps</span>
                    <strong>{stats.overlaps}</strong>
                </div>
                <div>
                    <span>Min spacing</span>
                    <strong>{stats.minSpacing.toFixed(2)}m</strong>
                </div>
                <div>
                    <span>Max radius</span>
                    <strong>{stats.maxRadius.toFixed(2)}m</strong>
                </div>
                <div>
                    <span>Mean radius</span>
                    <strong>{stats.meanRadius.toFixed(2)}m</strong>
                </div>
            </section>

            <section className={styles.views}>
                <div className={styles.panel}>
                    <h2>Density map</h2>
                    <p className={styles.caption}>
                        Green trees are spaced correctly. Red marks spacing
                        violations. Grid lines are chunks; dashed bounds show
                        where authored content allows movement.
                    </p>
                    <div className={styles.mapWrap}>
                        <ForestSimMap plants={plants} />
                    </div>
                </div>

                <div className={styles.panel}>
                    <h2>3D preview</h2>
                    <p className={styles.caption}>
                        Same simulated plants rendered with the live garden scene.
                    </p>
                    <GardenScene
                        plants={plants}
                        className={styles.scene}
                        canvasClassName={styles.canvas}
                        cameraOffset={OVERVIEW_CAMERA.offset}
                        cameraTarget={OVERVIEW_CAMERA.target}
                        minDistance={OVERVIEW_CAMERA.minDistance}
                        maxDistance={OVERVIEW_CAMERA.maxDistance}
                        scrollWalk={false}
                        walkNavigation={false}
                    />
                </div>
            </section>
        </div>
    );
};

export default ForestSim;
