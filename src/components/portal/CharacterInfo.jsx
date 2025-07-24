// External Libraries
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";

// Components
import { DropZone } from "components/effect/drop-zone";
import LevelBar from "components/hud/LevelBar";
import Name from "components/hud/Name";

// Styles
import "styles/CharacterInfo.scss";

// Data
import data, { level } from "api/data"

const CharacterInfo = () => {

    return (
        <div className="character-info">
            <div className="content">
                {/* <div className="character-class-wrapper" augmented-ui="exe">
                    <AnimateText text={data.preface} />
                </div> */}

                <div className="horizon-wrapper">
                    <div className="leftArrow">
                        <FontAwesomeIcon className="navigation-left-icon" icon={faCaretLeft} />
                    </div>
                    
                    <div className="character-details-wrapper">
                        <div className="character-name-wrapper">
                            <Name className="character-name-hud" />
 
                            <div className="character-level-wrapper">
                                <LevelBar className="character-level-bar" />
                                <div className="character-class-label">Online</div>
                                <div className="character-level-label">{level}</div>
                            </div>
                            </div>

                        <div className="divider"/>

                        <div className="character-details-info-wrapper">
                            <div className="character-details-info-group">
                                <div className="character-details-info" augmented-ui="exe">Web Dev</div>
                                <div className="character-details-info" augmented-ui="exe">Art</div>
                                <div className="character-details-info" augmented-ui="exe">DIY</div>
                            </div>
                            <div className="character-details-info-group">
                                <div className="character-details-info" augmented-ui="exe">Music</div>
                                <div className="character-details-info" augmented-ui="exe">Plants</div>
                                <div className="character-details-info" augmented-ui="exe">Reading</div>
                            </div>
                                <div className="character-details-info-group">
                                <div className="character-details-info" augmented-ui="exe">Long Walks</div>
                                <div className="character-details-info" augmented-ui="exe">Writing</div>
                            </div>
                        </div>
                    </div>

                    <div className="character-node-wrapper">
                        


                        <div className="character-node-list">
                            {['Toolkit', 'Projects', 'Connection', 'Experience', 'Interests'].map((nodeName) => (
                                <div 
                                    key={nodeName}
                                    className={`character-node`}
                                >
                                    <div className="character-node-text">
                                        {nodeName}
                                    </div>   
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rightArrow">
                        <FontAwesomeIcon className="navigation-right-icon" icon={faCaretRight} />
                    </div>
                </div>

                <div className="character-details-wrapper">
                    <DropZone skillsData={data.skills} />
                </div>
            </div>
        </div>
    );
};

export default CharacterInfo;
