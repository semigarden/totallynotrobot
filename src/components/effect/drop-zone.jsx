import React, { useCallback, useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import update from "immutability-helper";

import { Skill } from "components/common/Skill";

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const Backend = isMobile ? TouchBackend : HTML5Backend; 

export function DropZone({ skillsData, skillRefs }) {
    const [skills, setSkills] = useState(skillsData);

    useEffect(() => {
        setSkills(skillsData);
    }, [skillsData]);

    const moveRow = useCallback((dragIndex, hoverIndex) => {
        setSkills((prevCharacters) =>
            update(prevCharacters, {
                $splice: [
                    [dragIndex, 1],
                    [hoverIndex, 0, prevCharacters[dragIndex]]
                ]
            })
        );

    }, []);

    return (
        <DndProvider backend={Backend}>
            <div className="character-skill-list-wrapper">
                {skills.map((skill, index) => (
                    <Skill
                        index={index}
                        key={skill.label}
                        skill={skill}
                        moveRow={moveRow}
                        skillRefs={skillRefs}
                    />
                ))}
            </div>
        </DndProvider>
    );
}
