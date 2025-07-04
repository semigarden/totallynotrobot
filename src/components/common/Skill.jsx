import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import SkillIcon from "./SkillIcon.tsx";

export function Skill({ skill, moveRow, index }) {
  const ref = useRef(null);

  const [collectedProps, drop] = useDrop({
    accept: "dnd-character",
    collect(monitor) {
      return {
          handlerId: monitor.getHandlerId()
      };
    },

    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    }
  });

  const [collectedDragProps, drag] = useDrag({
    type: "dnd-character",

    item: () => {
      return { skill, index };
    },

    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const trans = collectedDragProps.isDragging ? 0 : 1;

  drag(drop(ref));

  return (
    <div
      className="character-skill-wrapper"
      ref={ref}
      style={{
          opacity: trans,
          willChange: collectedDragProps.isDragging ? 'transform' : 'auto'
      }}
      data-handler-id={collectedProps.handlerId}
    >
      <SkillIcon icon={skill.icon} iconType={skill.iconType} color={skill.color} animation={`character-skill-icon ${skill.animation}`} />
      <div className="character-skill-label">{skill.label}</div>
    </div>
  );
}
