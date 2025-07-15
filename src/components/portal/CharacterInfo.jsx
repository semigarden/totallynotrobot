// External Libraries
import { useState } from "react";
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

import { useAutoAnimate } from "@formkit/auto-animate/react";

// Styles
import "styles/CharacterInfo.scss";

import data from "api/data"
import CircuitBoard from "components/portal/CircuitBoard";

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

    const handleReorder = (fromIndex, toIndex) => {
        const newSkillTabs = [...skillTabs];
        const [movedItem] = newSkillTabs.splice(fromIndex, 1);
        newSkillTabs.splice(toIndex, 0, movedItem);
        setSkillTabs(newSkillTabs);
    };

    const [characterIconRef, orbitIconRef, firstNameRef, lastNameRef, fullNameRef, skillsLabelRef, skillTabsRef] = useAutoAnimate();

    return (
        <div className="character-info">
            <div className="content">
                {/* <CircuitBoard className="circuit-board" /> */}
                <div className="character-class-wrapper">
                    <AnimateText text={"Voltage Dependence"} />
                    <AnimateText text={data.preface} />
                </div>

                <div className="horizon-wrapper">
                    {/* <div className="character-icon-wrapper">
                        <img 
                            ref={characterIconRef}
                            className="character-icon animate-float" 
                            src={CharacterIcon}
                            draggable="false"
                        />
                        <img 
                            ref={orbitIconRef} 
                            className="character-orbit-icon animate-orbit" 
                            src={CharacterOrbitIcon}
                            draggable="false"
                        />
                    </div> */}
                    {/* <div className="character-visual-wrapper">
                        <div
                            className="character-visual" 
                            // src={CharacterIcon}
                            draggable="false"
                        />
                    </div> */}

                    <div className="character-name-wrapper">
                        <CyberLabelMobileHud className="character-name-hud-mobile" />

                        <div 
                            ref={firstNameRef}
                            className="character-firstname-label animate-fade-in-0-5"
                        >
                            { data.firstName }
                        </div>

                        <div 
                            ref={lastNameRef}
                            className="character-lastname-label animate-fade-in-0-5"
                        >
                            { data.lastName }
                        </div>

                        <CyberLabelHud className="character-name-hud" />
                        <div 
                            ref={fullNameRef}
                            className="character-name-label animate-fade-in-4"
                        >
                            { data.fullName }
                        </div>
                    </div>

                    {/* <div className="character-node-wrapper">
                        <div className="character-node-list">
                            <div className="character-node">
                                Toolkit
                            </div>
                            <div className="character-node">
                                Projects
                            </div>
                            <div className="character-node">
                                Connection
                            </div>
                            <div className="character-node">
                                Experience
                            </div>
                            <div className="character-node">
                                Interests
                            </div>
                        </div>
                    </div> */}
                </div>

                <div className="character-details-wrapper">
                    <div className="character-details-label-wrapper">
                        {/* <div className="character-skills-label-wrapper"> */}
                            {/* <div className="character-skills-wrapper">
                                <CyberSkillHud className="character-skills-hud" />
                                <div 
                                    ref={skillsLabelRef}
                                    className="character-skills-label animate-fade-in-2"
                                >
                                    Skills
                                </div>
                            </div> */}
                            

                            <div className="character-skills-navigation">
                                <div ref={skillTabsRef} className="skill-tab">
                                    {skillTabs.map((skillTab, index) => (
                                        <SkillTab
                                            key={skillTab.code}
                                            skillTab={skillTab}
                                            index={index}
                                            isSelected={selectedSkillTab === skillTab}
                                            onClick={() => handleTabClick(skillTab)}
                                            onDrop={handleReorder}
                                        />
                                    ))}
                                </div>
                            </div>
                        {/* </div> */}

                        {/* <div className="character-skill-horizontal-divider"></div> */}
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
