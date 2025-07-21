import React, { useEffect, useRef, useState } from 'react';
import "styles/hud/LevelBar.scss";

const LevelBar = ({ className }) => {
    const levelBarRef = useRef(null);
    const totalBars = 20;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const targetMonth = 9;
    let progress;
    if (currentMonth >= targetMonth) {
      progress = 1;
    } else {
      progress = currentMonth / targetMonth;
    }
    const litBars = Math.round(progress * totalBars);
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
