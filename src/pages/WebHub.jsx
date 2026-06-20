import { Link } from "react-router-dom";
import GardenScene from "@/components/garden/GardenScene";
import { useWebGardens } from "@/hooks/useWebGardens";
import styles from "@/styles/WebHub.module.scss";

const HUB_CAMERA = {
    offset: { x: 0, y: 1.55, z: 6 },
    target: { x: 0, y: 0, z: 0 },
    minDistance: 1.2,
    maxDistance: 48,
};

const WebHub = () => {
    const { gardens, plants, loading, error, refreshGardens } = useWebGardens();

    return (
        <div className={styles.root}>
            <GardenScene
                plants={plants}
                className={styles.scene}
                canvasClassName={styles.canvas}
                cameraOffset={HUB_CAMERA.offset}
                cameraTarget={HUB_CAMERA.target}
                minDistance={HUB_CAMERA.minDistance}
                maxDistance={HUB_CAMERA.maxDistance}
                scrollWalk
                walkSpeed={0.005}
                walkNavigation
                walkPositionKey="web-hub"
                showDateTerritories
            />

            <aside className={styles.panel}>
                <header className={styles.header}>
                    <div>
                        <p className={styles.eyebrow}>Digital gardeners</p>
                        <h1 className={styles.title}>/web</h1>
                    </div>
                    <Link className={styles.backLink} to="/gallery">
                        Home
                    </Link>
                </header>

                <p className={styles.caption}>
                    Walk a shared RSS forest. Posts grow by date, while each
                    gardener&apos;s writing pulls into its own loose cluster.
                </p>

                <div className={styles.statusRow}>
                    <span>
                        {loading
                            ? "Syncing feeds..."
                            : `${plants.length} trees across ${gardens.length} gardens`}
                    </span>
                    <button type="button" onClick={refreshGardens} disabled={loading}>
                        Refresh
                    </button>
                </div>

                {error ? <p className={styles.error}>{error}</p> : null}

                <ul className={styles.gardenList}>
                    {gardens.map((garden) => (
                        <li key={garden.id} className={styles.gardenCard}>
                            <div className={styles.gardenMeta}>
                                <strong>{garden.name}</strong>
                                <span>
                                    {garden.itemCount}
                                    {garden.totalAvailable > garden.itemCount
                                        ? ` of ${garden.totalAvailable}`
                                        : ""}{" "}
                                    posts · center (
                                    {garden.centerX.toFixed(1)},{" "}
                                    {garden.centerZ.toFixed(1)})
                                </span>
                            </div>
                            <p className={styles.gardenDescription}>
                                {garden.description}
                            </p>
                            <div className={styles.gardenLinks}>
                                <a
                                    href={garden.homepage ?? garden.feedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Site
                                </a>
                                <a href={garden.feedUrl} target="_blank" rel="noreferrer">
                                    Feed
                                </a>
                                <span>
                                    {garden.feed?.source === "local"
                                        ? "feed.atom"
                                        : "fallback grove"}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </aside>
        </div>
    );
};

export default WebHub;
