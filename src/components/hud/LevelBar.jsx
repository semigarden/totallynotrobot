import React, { useEffect, useRef, useState } from 'react';
import "styles/hud/LevelBar.scss";
import { exp } from 'api/data';

const LevelBar = ({ className }) => {
    const levelBarRef = useRef(null);
    const totalBars = 20;

    const litBars = Math.round(exp * totalBars);
    const [animated, setAnimated] = useState(Array(totalBars).fill(false));

    useEffect(() => {
        const expBars = levelBarRef.current?.querySelectorAll('.exp');
        if (expBars) {
            expBars.forEach((bar, index) => {
                bar.style.animationDelay = `${index * 0.1}s`;
            });
        }
        setAnimated(Array(totalBars).fill(true));
    }, []);

    return (
        <div className={`level-bar ${className}`} ref={levelBarRef}>
            {Array.from({ length: totalBars }).map((_, index) => {
                const isLit = index < litBars && animated[index];
                return (
                    <div
                        className={`exp ${isLit ? 'lit' : ''}`}
                        key={index}
                        augmented-ui="tl-clip br-clip exe"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    />
                );
            })}
        </div>
    );
};

export default LevelBar;
