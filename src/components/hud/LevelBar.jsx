import React, { useEffect, useRef, useState } from 'react';
import styles from "@/styles/hud/LevelBar.module.scss";
import { exp } from '@/api/data';

const LevelBar = ({ className }) => {
    const levelBarRef = useRef(null);
    const totalBars = 20;

    const litBars = Math.round(exp * totalBars);
    const [animated, setAnimated] = useState(Array(totalBars).fill(false));

    useEffect(() => {
        const expBars = levelBarRef.current?.querySelectorAll(`.${styles.exp}`);
        if (expBars) {
            expBars.forEach((bar, index) => {
                bar.style.animationDelay = `${index * 0.1}s`;
            });
        }
        setAnimated(Array(totalBars).fill(true));
    }, []);

    return (
        <div className={`${styles.levelBar} ${className}`} ref={levelBarRef}>
            {Array.from({ length: totalBars }).map((_, index) => {
                const isLit = index < litBars && animated[index];
                return (
                    <div
                        className={`${styles.exp} ${isLit ? styles.lit : ''}`}
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
