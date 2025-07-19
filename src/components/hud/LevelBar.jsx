import React from 'react';
import "styles/hud/LevelBar.scss";

const LevelBar = ({ className }) => {
    return (
        <div className={`level-bar ${className}`}>
            {Array.from({ length: 20 }).map((_, index) => (
                <div className="exp" augmented-ui="tl-clip br-clip exe"/>
            ))}
        </div>
    );
};

export default LevelBar;
