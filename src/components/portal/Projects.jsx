import { useState } from "react";
import styles from "@/styles/Projects.module.scss";
import whiteLeadForest from "@/assets/White Lead Forest.gif";
import whiteLeadForestVisual from "@/assets/White Lead Forest.png";

const projects = [
    {
        id: 1,
        name: "White Lead Forest",
        description: "Interactive Memory",
        material: "Three.js // Blender // GLSL",
        time: "2026",
        visual: whiteLeadForestVisual,
        gif: whiteLeadForest,
    },
    {
        id: 2,
        name: "Memory Extract",
        description: "Embed Experiences",
        material: "JavaScript // Encoding",
        time: "2026",
        visual: whiteLeadForestVisual,
        gif: whiteLeadForest,
    },
    {
        id: 3,
        name: "Synthetic Markdown",
        description: "Live Editor",
        material: "TypeScript // React",
        time: "2026",
        visual: whiteLeadForestVisual,
        gif: whiteLeadForest,
    },
    {
        id: 4,
        name: "Pixel Index",
        description: "Terminal Media Viewer",
        material: "JavaScript",
        time: "2026",
        visual: whiteLeadForestVisual,
        gif: whiteLeadForest,
    },
];

const Projects = () => {
    const [currentProject, setCurrentProject] = useState(0);

    return (
        <div className={styles.projects}>
            <div className={styles.frame}>
                <img src={projects[currentProject].gif} alt={projects[currentProject].name} />
            </div>
            <div className={styles.list}>
            {projects.map((project, index) => (
                <div key={index} className={`${styles.item}${index === currentProject ? ` ${styles.active}` : ""}`} onClick={() => setCurrentProject(index)}>
                    <div className={`${styles.section} ${styles.section0}`}>
                        <div className={styles.index}>{index + 1 < 10 ? `0${index + 1}` : index + 1 < 100 ? `0${index + 1}` : index + 1}</div>
                        <div className={styles.symbol}>
                            <div className={styles.line0} />
                            <div className={styles.line1} />
                        </div>
                    </div>
                    <div className={styles.divider}>
                        <div className={styles.line0} />
                        <div className={styles.line1} />
                        <div className={styles.line2} />
                        <div className={styles.line3} />
                        {/* <div className={styles.line4} />
                        <div className={styles.line5} />
                        <div className={styles.line6} />
                        <div className={styles.line7} /> */}
                    </div>
                    <div className={`${styles.section} ${styles.section1}`}>
                        <div className={styles.info}>
                            <div className={styles.title}>{project.name}</div>
                            <div className={styles.text}>
                                <div className={styles.description}>{project.description}</div>
                                <div className={styles.material}>
                                    {project.material}
                                </div>
                            </div>
                            <div className={styles.time}>
                                {project.time}
                            </div>
                        </div>
                        <div className={styles.visual}>
                            <img src={project.visual} alt={project.name} />
                        </div>
                    </div>
                </div>
                ))}
            </div>
        </div>
    );
};

export default Projects;
