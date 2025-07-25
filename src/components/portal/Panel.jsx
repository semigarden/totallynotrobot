import { DropZone } from "@/components/effect/drop-zone";
import AnimateText from "@/components/effect/AnimateText";
import LevelBar from "@/components/hud/LevelBar";
import Name from "@/components/hud/Name";
import styles from "@/styles/Panel.module.scss";
import data, { level } from "@/api/data"

const Panel = () => {
    return (
        <div className={styles.panel}>
            <div className={styles.content}>
                <div className={styles.preface} augmented-ui="exe">
                    <AnimateText text={data.preface} className={styles.text} />
                </div>

                <div className={styles.info}>
                    <div className={styles.details}>
                        <div className={styles.hud}>
                            <Name className={styles.nameHud} />
 
                            <div className={styles.levelHud}>
                                <LevelBar className={styles.bar} />
                                <div className={styles.status}>Online</div>
                                <div className={styles.level}>{level}</div>
                            </div>
                        </div>

                        <div className={styles.divider}/>

                        <div className={styles.tags}>
                            <div className={styles.group}>
                                <div className={styles.name} augmented-ui="exe">Web Dev</div>
                                <div className={styles.name} augmented-ui="exe">Art</div>
                                <div className={styles.name} augmented-ui="exe">DIY</div>
                            </div>
                            <div className={styles.group}>
                                <div className={styles.name} augmented-ui="exe">Music</div>
                                <div className={styles.name} augmented-ui="exe">Plants</div>
                                <div className={styles.name} augmented-ui="exe">Reading</div>
                            </div>
                            <div className={styles.group}>
                                <div className={styles.name} augmented-ui="exe">Long Walks</div>
                                <div className={styles.name} augmented-ui="exe">Writing</div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.tabs}>
                        {['Toolkit', 'Projects', 'Connection', 'Experience', 'Interests'].map((nodeName) => (
                            <div 
                                key={nodeName}
                                className={styles.tab}
                            >
                                <div className={styles.name}>
                                    {nodeName}
                                </div>   
                            </div>
                        ))}
                    </div>
                </div>

                <DropZone className={styles.list} skillsData={data.skills} />
            </div>
        </div>
    );
};

export default Panel;
