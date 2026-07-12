import { useNavigate, useParams } from "react-router-dom";
import Drag from "@/components/effect/Drag";
import AnimateText from "@/components/effect/AnimateText";
import LightHud from "@/components/hud/LightHud";
import LevelBar from "@/components/hud/LevelBar";
import Name from "@/components/hud/Name";
import FullscreenToggle from "@/components/portal/FullscreenToggle";
import Manifesto from "@/components/portal/Manifesto";
import Gallery from "@/components/portal/Gallery";
import Garden from "@/components/portal/Garden";
import { TABS, tabFromParam } from "@/utils/tabRoute";
import styles from "@/styles/Panel.module.scss";
import memory, { level, exp } from "@/api/memory";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Panel = () => {
    const { tab: tabParam } = useParams();
    const navigate = useNavigate();
    const tab = tabFromParam(tabParam);

    const openTab = (nextTab) => {
        navigate(`/${nextTab.toLowerCase()}`);
    };

    return (
        <div className={styles.panel}>
            {/* <div className={styles.outerHud}>
                <div className={styles.corner0}>
                    <div className={styles.line0} />
                    <div className={styles.line1} />
                    <div className={styles.line2} />
                    <div className={styles.line3} />
                    <div className={styles.line4} />
                    <div className={styles.line5} />
                    <div className={styles.line6} />
                    <div className={styles.line7} />
                </div>
            </div> */}
            <FullscreenToggle
                className={styles.secretFullscreenDock}
                toggleClassName={styles.secretFullscreenToggle}
                iconEnterClassName={styles.secretFullscreenIconEnter}
                iconExitClassName={styles.secretFullscreenIconExit}
            />
            <div className={styles.content}>
                {/* <div className={styles.preface}>
                    <AnimateText text={memory.preface} className={styles.text} />
                </div> */}

                <div className={styles.info}>
                    <div className={styles.details}>
                        <div className={styles.hudRow}>
                        <div className={`${styles.hud} ${styles.assembling}`}>
                            <Name className={styles.nameHud} name={memory.name} />

                            <div className={styles.levelHud}>
                                <LevelBar className={styles.bar} exp={exp} />
                                    <div className={styles.status}>Online</div>
                                    <div className={styles.level}>{level}</div>
                                </div>
                            </div>

                            <LightHud className={styles.lightHud} />
                        </div>

                        {/* <div className={styles.divider} /> */}
                    </div>

                    {/* <div className={styles.sectionsHud}>
                        <div className={styles.lines}>
                            <div className={styles.line0} />
                            <div className={styles.line1} />
                            <div className={styles.line2} />
                            <div className={styles.line3} />
                            <div className={styles.line4} />
                            <div className={styles.line5} />
                            <div className={styles.line6} />
                            <div className={styles.line7} />
                        </div>

                        <div className={styles.listSections}>
                            <div className={styles.itemSection}>Manifesto <FontAwesomeIcon icon={faChevronRight} className={styles.arrow} /></div>
                            <div className={`${styles.itemSection} ${styles.active}`}>Gallery <FontAwesomeIcon icon={faChevronRight} className={styles.arrow} /></div>
                            <div className={styles.itemSection}>Garden <FontAwesomeIcon icon={faChevronRight} className={styles.arrow} /></div>
                            <div className={styles.itemSection}>Toolkit <FontAwesomeIcon icon={faChevronRight} className={styles.arrow} /></div>
                            <div className={styles.itemSection}>Projects <FontAwesomeIcon icon={faChevronRight} className={styles.arrow} /></div>
                        </div>
                    </div>

                    <div className={styles.sectionsHud2}>

                    <div className={styles.listSections}>
                            <div className={styles.itemSection}>Manifesto <FontAwesomeIcon icon={faChevronDown} className={styles.arrow} /></div>
                            <div className={`${styles.itemSection} ${styles.active}`}>Gallery <FontAwesomeIcon icon={faChevronDown} className={styles.arrow} /></div>
                            <div className={styles.itemSection}>Garden <FontAwesomeIcon icon={faChevronDown} className={styles.arrow} /></div>
                            <div className={styles.itemSection}>Toolkit <FontAwesomeIcon icon={faChevronDown} className={styles.arrow} /></div>
                            <div className={styles.itemSection}>Projects <FontAwesomeIcon icon={faChevronDown} className={styles.arrow} /></div>
                        </div>

                        <div className={styles.lines}>
                            <div className={styles.line0} />
                            <div className={styles.line1} />
                            <div className={styles.line2} />
                            <div className={styles.line3} />
                            <div className={styles.line4} />
                            <div className={styles.line5} />
                            <div className={styles.line6} />
                            <div className={styles.line7} />
                        </div>

                        
                    </div> */}

                    <div className={styles.tabs}>
                        {TABS.map((nodeName) => (
                                <div
                                    key={nodeName}
                                    className={`${styles.tab} ${tab === nodeName && styles.active}`}
                                    onClick={() => openTab(nodeName)}
                                >
                                    <div className={styles.name}>{nodeName}</div>
                                </div>
                        ))}
                    </div>
                </div>

                <div
                    className={`${styles.tabPane} ${
                        tab === "Garden" ? styles.tabPaneFill : ""
                    }`}
                >
                    {tab === "Gallery" && <Gallery />}
                    {/* {tab === "Manifesto" && <Manifesto />} */}
                    {tab === "Garden" && <Garden />}
                    {tab === "Toolkit" && (
                        <Drag className={styles.list} itemsData={memory.items} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Panel;
