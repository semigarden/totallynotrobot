// External Libraries
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";

// Components
import { DropZone } from "@/components/effect/drop-zone";
import LevelBar from "@/components/hud/LevelBar";
import Name from "@/components/hud/Name";

// Styles
import styles from "@/styles/Panel.module.scss";

// Data
import data, { level } from "@/api/data"

const CharacterInfo = () => {

    return (
        <div className={styles.panel}>
            <div className={styles.content}>
                {/* <div className="character-class-wrapper" augmented-ui="exe">
                    <AnimateText text={data.preface} />
                </div> */}

                <div className={styles.horizonWrapper}>
                    <div className={styles.characterDetailsWrapper}>
                        <div className={styles.characterNameWrapper}>
                            <Name className={styles.characterNameHud} />
 
                            <div className={styles.characterLevelWrapper}>
                                <LevelBar className={styles.characterLevelBar} />
                                <div className={styles.characterClassLabel}>Online</div>
                                <div className={styles.characterLevelLabel}>{level}</div>
                            </div>
                            </div>

                        <div className={styles.divider}/>

                        <div className={styles.characterDetailsInfoWrapper}>
                            <div className={styles.characterDetailsInfoGroup}>
                                <div className={styles.characterDetailsInfo} augmented-ui="exe">Web Dev</div>
                                <div className={styles.characterDetailsInfo} augmented-ui="exe">Art</div>
                                <div className={styles.characterDetailsInfo} augmented-ui="exe">DIY</div>
                            </div>
                            <div className={styles.characterDetailsInfoGroup}>
                                <div className={styles.characterDetailsInfo} augmented-ui="exe">Music</div>
                                <div className={styles.characterDetailsInfo} augmented-ui="exe">Plants</div>
                                <div className={styles.characterDetailsInfo} augmented-ui="exe">Reading</div>
                            </div>
                                <div className={styles.characterDetailsInfoGroup}>
                                <div className={styles.characterDetailsInfo} augmented-ui="exe">Long Walks</div>
                                <div className={styles.characterDetailsInfo} augmented-ui="exe">Writing</div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.characterNodeWrapper}>
                        


                        <div className={styles.characterNodeList}>
                            {['Toolkit', 'Projects', 'Connection', 'Experience', 'Interests'].map((nodeName) => (
                                <div 
                                    key={nodeName}
                                    className={styles.characterNode}
                                >
                                    <div className={styles.characterNodeText}>
                                        {nodeName}
                                    </div>   
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.characterDetailsWrapper}>
                    <DropZone skillsData={data.skills} />
                </div>
            </div>
        </div>
    );
};

export default CharacterInfo;
