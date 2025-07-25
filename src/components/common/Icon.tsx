import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MdiIcon from '@mdi/react';
import { SizeProp } from "@fortawesome/fontawesome-svg-core";

const Icon: React.FC<{ icon: any, iconType: string, color: string, animation: string, size: string, className: string }> = ({ icon, iconType, color, animation, size = "1x", className = "" }) => {
  if (iconType === "mdi" && icon && typeof icon === "object" && icon.path) {
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
        className={`${animation} ${className}`}
      >
        <path fill="currentColor" d={icon.path} />
      </svg>
    );
  }

  if (iconType === "svg" && typeof icon === "function") {
    const IconComponent = icon;
    return <IconComponent color={color} className={`${animation} ${className}`} />;
  }

  return (
    iconType == "mdi" ? (
      <MdiIcon path={icon} className={`${animation} ${className}`} />
    ) : (
      <FontAwesomeIcon
        icon={icon}
        style={{ color: color }}
        className={`${animation} ${className}`}
        size={size as SizeProp}
      />
  ));
};

export default Icon;
