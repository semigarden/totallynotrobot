import React, { useEffect, useRef } from 'react';
import "styles/hud/LevelBar.scss";

const LevelBar = ({ className }) => {
    const levelBarRef = useRef(null);

    useEffect(() => {
        const expBars = levelBarRef.current?.querySelectorAll('.exp');
        if (expBars) {
            expBars.forEach((bar, index) => {
                bar.style.animationDelay = `${index * 0.1}s`;
            });
        }
    }, []);

    return (
        <div className={`level-bar ${className}`} ref={levelBarRef}>
            {Array.from({ length: 20 }).map((_, index) => (
                <div className="exp" key={index} augmented-ui="tl-clip br-clip exe"/>
            ))}
        </div>
    );
};

export default LevelBar;
