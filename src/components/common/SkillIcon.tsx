import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Icon from '@mdi/react';
import { SizeProp } from "@fortawesome/fontawesome-svg-core";

const SkillIcon: React.FC<{ icon: any, iconType: string, color: string, animation: string, size: string }> = ({ icon, iconType, color, animation, size = "1x" }) => {
  if (iconType === "mdi" && icon && typeof icon === "object" && icon.path) {
    // Render MDI icon as SVG
    return (
      <svg
        viewBox="0 0 24 24"
        style={{
          color: color,
          width: "1em",
          height: "1em",
          display: "inline-block",
          verticalAlign: "-0.125em",
        }}
        className={animation}
      >
        <path fill="currentColor" d={icon.path} />
      </svg>
    );
  }

  // Render FontAwesome icon
  return (
    iconType == "mdi" ? (
      <Icon path={icon} className={animation} />
    ) : (
      <FontAwesomeIcon
        icon={icon}
        style={{ color: color }}
        className={animation}
        size={size as SizeProp}
      />
  ));
};

export default SkillIcon; 