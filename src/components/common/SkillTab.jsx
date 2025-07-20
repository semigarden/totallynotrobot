import React, { useState, useRef } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

import CyberDescLabelHud from "components/hud/CyberDescLabelHud";

const SkillTab = ({ className = "", skillTab, onClick, isSelected, onDragStart, onDragOver, onDrop, index, connectedNode }) => {
  const [textRef] = useAutoAnimate();
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) onDragStart(e, index);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (onDragOver) onDragOver(e, index);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const toIndex = index;
    if (onDrop && fromIndex !== toIndex) {
      onDrop(fromIndex, toIndex);
    }
  };

  return (
    <div
      ref={dragRef}
      draggable
      // onDragStart={handleDragStart}
      // onDragEnd={handleDragEnd}
      // onDragOver={handleDragOver}
      // onDrop={handleDrop}
      style={{ 
        willChange: 'transform, opacity',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        transition: 'opacity 0.2s, transform 0.2s',
      }}
      className={`${className} character-skill-label-wrapper animate-skill-tab ${isSelected ? "selected" : ""} ${connectedNode ? "connected" : ""} ${isDragging ? "dragging" : ""}`}
      // onPointerDown={onClick}
      data-index={index}
    >
      <CyberDescLabelHud className="character-skill-label-hud" />
      <div 
        ref={textRef}
        className={`character-skill-label-text animate-skill-text ${isSelected ? "selected" : ""}`}
        style={{ willChange: 'opacity' }}
      >
        {connectedNode || skillTab.label}
      </div>
      {/* {connectedNode && (
        <div className="connected-node-indicator">
          {connectedNode}
        </div>
      )} */}
    </div>
  );
};

export default SkillTab;