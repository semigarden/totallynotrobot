import GardenControls from "@/components/garden/GardenControls";
import LevelBar from "@/components/hud/LevelBar";
import Name from "@/components/hud/Name";
import memory, { level, exp } from "@/api/memory";
import styles from "@/styles/ImmersiveLayout.module.scss";

const ImmersiveChrome = ({ plants = [], onPlant }) => (
    <>
        <div className={styles.hudDock}>
            <div className={styles.hudImmersive}>
                <div className={styles.hudStage}>
                    <Name name={memory.name} />

                    <div className={styles.levelHud}>
                        <LevelBar className={styles.bar} exp={exp} />
                        <div className={styles.status}>Online</div>
                        <div className={styles.level}>{level}</div>
                    </div>
                </div>
            </div>
        </div>

        <div className={styles.inputDock}>
            <GardenControls
                plants={plants}
                onPlant={onPlant}
                showHeader={false}
                showLabel={false}
                inputId="immerse-plant"
                formClassName={styles.plantForm}
                inputClassName={styles.plantInput}
            />
        </div>
    </>
);

export default ImmersiveChrome;
