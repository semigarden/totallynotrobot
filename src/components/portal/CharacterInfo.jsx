// External Libraries
import { useState } from "react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";

// Components
import { DropZone } from "components/effect/drop-zone";
import SkillTab from "components/common/SkillTab";
import AnimateText from "components/effect/AnimateText";

// Huds
import CyberLabelMobileHud from "components/hud/CyberLabelMobileHud";
import CyberLabelHud from "components/hud/CyberLabelHud";
import CyberSkillHud from "components/hud/CyberSkillHud";

// Assets
import CharacterOrbitIcon from "assets/sleeper-orbit.webp";
import CharacterIcon from "assets/sleeper-only.webp";

// Styles
import "styles/CharacterInfo.scss";

import data from "api/data"

const CharacterInfo = () => {
    const initialSkillTabs = data.skillTabs;

    const [skillTabs, setSkillTabs] = useState(initialSkillTabs);
    const [selectedSkillTab, setSelectedSkillTab] = useState(skillTabs[0]);

    const initialSkills = data.skills;

    let [skills] = useState(initialSkills);
    skills = skills.filter((skill) => (skill.category === selectedSkillTab.code))

    const handleTabClick = (clickedTab) => {
        if (skillTabs[0] === clickedTab) {
            setSelectedSkillTab(clickedTab);
            return;
        }
        
        const updatedSkillTabs = skillTabs.filter((tab) => tab !== clickedTab);
        updatedSkillTabs.unshift(clickedTab);

        skills = skills.filter((skill) => (skill.category === selectedSkillTab.code))
    
        setSkillTabs(updatedSkillTabs);
        setSelectedSkillTab(clickedTab);
    };

    const descriptionText = data.bio

    return (
        <div className="character-info">
            <div className="content">
                <div className="character-class-wrapper">
                    <AnimateText text={descriptionText} />
                </div>

                <div className="horizon-wrapper">
                    <div className="character-icon-wrapper">
                        <motion.img className="character-icon" src={CharacterIcon}
                            draggable="false"
                            animate={{ y: [0, 5, 0] }}
                            transition={{
                                times: [0, 1],
                                delay: 2,
                                duration: 4,
                                repeat: Infinity,
                                type: "keyframes",
                                ease: "easeInOut",
                            }}
                        />
                        <motion.img className="character-orbit-icon" src={CharacterOrbitIcon}
                            draggable="false"
                            animate={{ y: [0, 10, 0] }}
                            transition={{
                                times: [0, 1],
                                duration: 3,
                                repeat: Infinity,
                                type: "keyframes",
                                ease: "easeInOut",
                            }}
                        />
                    </div>

                    <div className="character-name-wrapper">
                        <CyberLabelMobileHud className="character-name-hud-mobile" />

                        <motion.div className="character-firstname-label"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 3 }}
                        >{ data.firstName }</motion.div>

                        <motion.div className="character-lastname-label"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 3 }}
                        >{ data.lastName }</motion.div>

                        <CyberLabelHud className="character-name-hud" />
                        <motion.div className="character-name-label"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 4, duration: 3 }}
                        >{ data.fullName }</motion.div>
                    </div>
                </div>

                <div className="character-details-wrapper">
                    <div className="character-details-label-wrapper">
                        <div className="character-skills-wrapper">
                            <CyberSkillHud className="character-skills-hud" />
                            <motion.div className="character-skills-label"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2, duration: 3 }}
                            >Skills</motion.div>
                        </div>
                        

                        <nav className="character-skills-navigation">
                            <Reorder.Group
                                as="ul"
                                axis="x"
                                onReorder={setSkillTabs}
                                className="skill-tab"
                                values={skillTabs}
                            >
                                <AnimatePresence initial={false}>
                                    {skillTabs.map((skillTab) => (
                                        <SkillTab
                                            key={skillTab.code}
                                            skillTab={skillTab}
                                            isSelected={selectedSkillTab === skillTab}
                                            onClick={() => handleTabClick(skillTab)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </Reorder.Group>
                        </nav>
                    </div>

                    <div className="character-skill-horizontal-divider"></div>
                    
                    <DropZone skillsData={skills} />
                </div>
            </div>

            <div className="leftArrow">
                <FontAwesomeIcon className="navigation-left-icon" icon={faCaretLeft} />
            </div>
            <div className="rightArrow">
                <FontAwesomeIcon className="navigation-right-icon" icon={faCaretRight} />
            </div>
        </div>
    );
};

export default CharacterInfo;
