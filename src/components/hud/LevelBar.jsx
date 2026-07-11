import { useEffect, useState } from 'react';
import styles from "@/styles/hud/LevelBar.module.scss";

const ASSEMBLE_BASE_DELAY = 1.08;
const ASSEMBLE_STAGGER = 0.045;
const ASSEMBLE_SEGMENT_MS = 340;
const LIT_STAGGER = 0.11;
const totalBars = 20;

const getAssembleCompleteMs = () =>
    (ASSEMBLE_BASE_DELAY + (totalBars - 1) * ASSEMBLE_STAGGER + ASSEMBLE_SEGMENT_MS / 1000) *
    1000;

const LevelBar = ({ className, exp = 0, animate = true }) => {
    const litBars = Math.round(exp * totalBars);
    const [assembling, setAssembling] = useState(animate);
    const [litThrough, setLitThrough] = useState(animate ? -1 : litBars - 1);

    useEffect(() => {
        if (!animate) {
            setAssembling(false);
            setLitThrough(litBars - 1);
            return;
        }

        setAssembling(true);
        setLitThrough(-1);

        const assembleCompleteMs = getAssembleCompleteMs();
        const timers = [];

        timers.push(
            window.setTimeout(() => {
                setAssembling(false);
            }, assembleCompleteMs)
        );

        for (let index = 0; index < litBars; index += 1) {
            timers.push(
                window.setTimeout(() => {
                    setLitThrough(index);
                }, assembleCompleteMs + 160 + index * LIT_STAGGER * 1000)
            );
        }

        return () => {
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, [animate, litBars]);

    return (
        <div className={`${styles.levelBar} ${assembling ? styles.assembling : ""} ${className}`}>
            {Array.from({ length: totalBars }).map((_, index) => {
                const isLit = index <= litThrough && index < litBars;

                return (
                    <div
                        className={`${styles.exp} ${isLit ? styles.lit : ""}`}
                        key={index}
                        style={{
                            animationDelay: assembling
                                ? `${ASSEMBLE_BASE_DELAY + index * ASSEMBLE_STAGGER}s`
                                : undefined,
                        }}
                    />
                );
            })}
        </div>
    );
};

export default LevelBar;
