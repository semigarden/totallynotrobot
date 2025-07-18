// External Libraries
import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretLeft, faCaretRight, faCaretDown } from "@fortawesome/free-solid-svg-icons";

// Components
import { DropZone } from "components/effect/drop-zone";
import SkillTab from "components/common/SkillTab";
import AnimateText from "components/effect/AnimateText";

// Huds
import CyberLabelMobileHud from "components/hud/CyberLabelMobileHud";
import CyberLabelHud from "components/hud/CyberLabelHud";
import CyberSkillHud from "components/hud/CyberSkillHud";
import CyberDescLabelHud from "components/hud/CyberDescLabelHud";
import CyberLevelBar from "components/hud/CyberLevelBar";

// Assets
import CharacterOrbitIcon from "assets/sleeper-orbit.webp";
import CharacterIcon from "assets/sleeper-only.webp";

import { useAutoAnimate } from "@formkit/auto-animate/react";

// Styles
import "styles/CharacterInfo.scss";

import data from "api/data"
import CircuitBoard from "components/portal/CircuitBoard";

const defaultConnections = {
    "0": "Projects",
    "1": "Toolkit",
    "4": "Connection",
    "2": "Experience",
    "3": "Interests"
}

const CharacterInfo = () => {
    const initialSkillTabs = data.skillTabs;

    const [skillTabs, setSkillTabs] = useState(initialSkillTabs);
    const [selectedSkillTab, setSelectedSkillTab] = useState(skillTabs[0]);

    const initialSkills = data.skills;

    let [skills] = useState(initialSkills);
    skills = skills.filter((skill) => (skill.category === selectedSkillTab.code))

    // Drag and drop state
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNode, setDraggedNode] = useState(null);
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const [connectedNodes, setConnectedNodes] = useState({});
    const [nodePositions, setNodePositions] = useState({});
    const [slotPositions, setSlotPositions] = useState({});

    const characterNodeRefs = useRef({});
    const skillTabRefs = useRef({});

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

    // Drag handlers
    const handleDragStart = (e, nodeName) => {
        setIsDragging(true);
        setDraggedNode(nodeName);
        
        const rect = e.currentTarget.getBoundingClientRect();
        const svgContainer = document.querySelector('.cable-layer');
        if (svgContainer) {
            const svgRect = svgContainer.getBoundingClientRect();
            setDragPosition({
                x: rect.left + rect.width / 2 - svgRect.left,
                y: rect.bottom + 6 + 3.25 - svgRect.top // Connector-hole position
            });
        } else {
            setDragPosition({
                x: rect.left + rect.width / 2,
                y: rect.bottom + 6 + 3.25
            });
        }
    };

    const handleDrag = (e) => {
        if (isDragging) {
            const svgContainer = document.querySelector('.cable-layer');
            if (svgContainer) {
                const svgRect = svgContainer.getBoundingClientRect();
                setDragPosition({
                    x: e.clientX - svgRect.left,
                    y: e.clientY - svgRect.top
                });
            } else {
                setDragPosition({
                    x: e.clientX,
                    y: e.clientY
                });
            }
        }
    };

    const handleDragEnd = (e) => {
        if (!isDragging) return;

        // Check if dropped on a skill tab
        const skillTabElement = e.target.closest('.character-skill-label-wrapper');
        if (skillTabElement) {
            const skillTabIndex = parseInt(skillTabElement.dataset.index);
            const skillTab = skillTabs[skillTabIndex];
            
            if (skillTab && draggedNode) {
                setConnectedNodes(prev => ({
                    ...prev,
                    [skillTab.code]: draggedNode
                }));
            }
        }

        setIsDragging(false);
        setDraggedNode(null);
    };

    // Update positions when component mounts
    useEffect(() => {
        const updatePositions = () => {
            const svgContainer = document.querySelector('.cable-layer');
            if (!svgContainer) return;
            
            const svgRect = svgContainer.getBoundingClientRect();
            
            // Update node positions (connector-hole center positions)
            const newNodePositions = {};
            Object.keys(characterNodeRefs.current).forEach(nodeName => {
                const element = characterNodeRefs.current[nodeName];
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const isConnected = Object.values(connectedNodes).includes(nodeName);
                    
                    // Calculate position relative to SVG container
                    // For connected nodes, the connector-hole is closer to the top due to reduced height
                    const connectorOffset = isConnected ? 10 : 14; // Adjust offset for connected vs unconnected
                    newNodePositions[nodeName] = {
                        x: rect.left + rect.width / 2 - svgRect.left,
                        y: rect.bottom + connectorOffset - svgRect.top // Exact center of connector-hole
                    };
                }
            });
            setNodePositions(newNodePositions);

            // Update slot positions (top center of skill tabs)
            const newSlotPositions = {};
            Object.keys(skillTabRefs.current).forEach(slotIndex => {
                const element = skillTabRefs.current[slotIndex];
                if (element) {
                    const rect = element.getBoundingClientRect();
                    newSlotPositions[slotIndex] = {
                        x: rect.left + rect.width / 2 - svgRect.left - 4,
                        y: rect.top - svgRect.top // Top of the skill tab
                    };
                }
            });
            setSlotPositions(newSlotPositions);
        };

        updatePositions();
        window.addEventListener('resize', updatePositions);
        return () => window.removeEventListener('resize', updatePositions);
    }, [skillTabs, connectedNodes]); // Add connectedNodes to dependencies

    // Draw bezier curve cable
    const drawCable = (startX, startY, endX, endY) => {
        const controlPoint1X = startX;
        const controlPoint1Y = startY + (endY - startY) * 0.3;
        const controlPoint2X = endX;
        const controlPoint2Y = startY + (endY - startY) * 0.7;

        return `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
    };

    const [characterIconRef, orbitIconRef, firstNameRef, lastNameRef, fullNameRef, skillsLabelRef, skillTabsRef] = useAutoAnimate();

    return (
        <div className="character-info" onMouseMove={handleDrag} onMouseUp={handleDragEnd}>
            <div className="content">
                {/* <CircuitBoard className="circuit-board" /> */}
                <div className="character-class-wrapper">
                    {/* <AnimateText text={"Preface Title"} /> */}
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

                    <div className="character-details-wrapper">
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

                            <div className="character-level-wrapper">
                                <CyberLevelBar className="character-level-bar" />
                                <div className="character-class-label">Nomad</div>
                                <div className="character-level-label">26</div>
                            </div>
                        </div>

                        <div className="character-details-info-wrapper">
                            <div className="character-details-info-group">
                                <div className="character-details-info">Web Dev</div>
                                <div className="character-details-info">Art</div>
                            </div>
                            <div className="character-details-info-group">
                                <div className="character-details-info">Plants</div>
                                <div className="character-details-info">Long Walks</div>
                            </div>
                            <div className="character-details-info-group">
                                <div className="character-details-info">Reading</div>
                                <div className="character-details-info">Writing</div>
                            </div>
                            <div className="character-details-info-group">
                                <div className="character-details-info">Music</div>
                                <div className="character-details-info">DIY</div>
                            </div>
                        </div>
                    </div>

                    <div className="character-node-wrapper">
                        <div className="character-node-list">
                            {['Toolkit', 'Projects', 'Connection', 'Experience', 'Interests'].map((nodeName) => (
                                <div 
                                    key={nodeName}
                                    ref={el => characterNodeRefs.current[nodeName] = el}
                                    className={`character-node ${isDragging && draggedNode === nodeName ? 'dragging' : ''} ${Object.values(connectedNodes).includes(nodeName) ? 'connected' : ''}`}
                                    draggable={!Object.values(connectedNodes).includes(nodeName)}
                                    onMouseDown={(e) => handleDragStart(e, nodeName)}
                                >
                                    <CyberDescLabelHud className="character-node-hud" />
                                    <div className="character-node-text">
                                        {!Object.values(connectedNodes).includes(nodeName) && nodeName}
                                    </div>
                                    <div className="connector-hole">
                                        <FontAwesomeIcon icon={faCaretDown} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="character-details-wrapper">
                    {/* SVG for cables */}
                    <svg 
                        className="cable-layer" 
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 1
                        }}
                    >
                        {/* Draw permanent connections */}
                        {Object.entries(connectedNodes).map(([slotCode, nodeName]) => {
                            const nodePos = nodePositions[nodeName];
                            const slotIndex = skillTabs.findIndex(tab => tab.code === slotCode);
                            const slotPos = slotPositions[slotIndex];
                            
                            if (nodePos && slotPos) {
                                const pathData = drawCable(nodePos.x, nodePos.y, slotPos.x, slotPos.y);
                                return (
                                    <path
                                        key={`${slotCode}-${nodeName}`}
                                        d={pathData}
                                        stroke="#ff0000"
                                        strokeWidth="2"
                                        fill="none"
                                    />
                                );
                            }
                            return null;
                        })}

                        {/* Draw dragging cable */}
                        {isDragging && draggedNode && nodePositions[draggedNode] && (
                            <path
                                d={drawCable(
                                    nodePositions[draggedNode].x,
                                    nodePositions[draggedNode].y,
                                    dragPosition.x,
                                    dragPosition.y
                                )}
                                stroke="#ff0000"
                                strokeWidth="2"
                                fill="none"
                            />
                        )}
                    </svg>

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
                                        <div key={skillTab.code} ref={el => skillTabRefs.current[index] = el}>
                                            <SkillTab
                                                skillTab={skillTab}
                                                index={index}
                                                isSelected={selectedSkillTab === skillTab}
                                                onClick={() => handleTabClick(skillTab)}
                                                onDrop={handleReorder}
                                                connectedNode={connectedNodes[skillTab.code]}
                                            />
                                        </div>
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
