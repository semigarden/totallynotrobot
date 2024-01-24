import React from "react";
import { motion, Reorder } from "framer-motion";

import CyberDescLabelHud from "components/hud/CyberDescLabelHud";

const SkillTab = ({ skillTab, onClick, isSelected }) => {
  return (
    <Reorder.Item
      value={skillTab}
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.15 }
      }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.3 } }}
      className={`character-skill-label-wrapper ${isSelected ? "selected" : ""}`}
      onPointerDown={onClick}
    >
      <CyberDescLabelHud className="character-skill-label-hud" />
      <motion.div className={`character-skill-label-text ${isSelected ? "selected" : ""}`}
        initial={{ opacity: isSelected ? [0, 1] : 0 }}
        animate={{ opacity: [0, 1] }}
        transition={{ delay: 2, duration: 3 }}
      >
        {skillTab.label}
      </motion.div>
    </Reorder.Item>
  );
};

export default SkillTab;