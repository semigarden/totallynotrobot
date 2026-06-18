import GardenControls from "@/components/garden/GardenControls";
import FullscreenToggle from "@/components/portal/FullscreenToggle";
import styles from "@/styles/ImmersiveLayout.module.scss";

const ImmersionChrome = ({
    plants = [],
    onPlant,
    onRandomPlant,
    onDeleteLastPlant,
}) => (
    <>
        <div className={styles.mobileActionDock}>
            <button
                type="button"
                className={styles.mobileActionButton}
                onClick={onDeleteLastPlant}
                aria-label="Remove last plant"
                title="Remove last plant"
            >
                <span className={styles.mobileActionIconDelete} aria-hidden="true" />
            </button>
        </div>

        <div className={`${styles.mobileActionDock} ${styles.mobileActionDockCreate}`}>
            <button
                type="button"
                className={styles.mobileActionButton}
                onClick={onRandomPlant}
                aria-label="Grow random plant"
                title="Grow random plant"
            >
                <span className={styles.mobileActionIconCreate} aria-hidden="true" />
            </button>
        </div>

        <FullscreenToggle />

        <div className={styles.inputDock}>
            <GardenControls
                plants={plants}
                onPlant={onPlant}
                onRandomPlant={onRandomPlant}
                onDeleteLastPlant={onDeleteLastPlant}
                showHeader={false}
                showLabel={false}
                showActionButton
                inputId="immersion-plant"
                formClassName={styles.plantForm}
                inputClassName={styles.plantInput}
                actionClassName={styles.plantAction}
            />
        </div>
    </>
);

export default ImmersionChrome;
