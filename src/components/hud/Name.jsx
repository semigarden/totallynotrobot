import { useEffect, useRef, useState } from 'react';
import styles from "@/styles/hud/Name.module.scss";

const ASSEMBLE_DELAY = 1.2;
const ARROW_STAGGER = 0.08;
const ASSEMBLE_MS = 5500;

const Name = ({ className, name = "", animate = true }) => {
    const animationRef = useRef(null);
    const [assembling, setAssembling] = useState(animate);

    useEffect(() => {
        if (!animate) {
            setAssembling(false);
            return;
        }

        setAssembling(true);

        const arrows = animationRef.current?.querySelectorAll(`.${styles.arrow}`);
        if (arrows) {
            arrows.forEach((arrow, index) => {
                arrow.style.animationDelay = `${ASSEMBLE_DELAY + index * ARROW_STAGGER}s`;
            });
        }

        const assembleTimer = window.setTimeout(() => {
            setAssembling(false);
        }, ASSEMBLE_MS);

        return () => {
            window.clearTimeout(assembleTimer);
        };
    }, [animate]);

    return (
        <div
            className={`${styles.name} ${animate ? styles.introLive : ""} ${assembling ? styles.assembling : ""} ${className}`}
        >
            <div className={styles.circle}>
                <div className={styles.circleGlow}/>
            </div>
            <div className={styles.circleLine}>
                <div className={styles.line0}/>
                <div className={styles.line1}/>
            </div>
            <div className={styles.square}>
                <div className={styles.squareGlow}/>
            </div>
            <div className={styles.frame}>
                <div className={styles.frameTop}>
                    <div className={styles.frame1}/>
                    <div className={styles.line1}/>
                    <div className={styles.line2}/>
                    <div className={styles.frame2}/>
                    <div className={styles.frame3}/>
                </div>
                <div className={styles.frameMain}>
                    <div className={styles.text}>{name}</div>
                    <div className={styles.animation} ref={animationRef}>
                        {Array.from({length: 16}).map((_, index) => (
                            <div className={styles.arrow} key={index}>
                                <div className={styles.line1}/>
                                <div className={styles.line2}/>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.frameBottom}>
                    <div className={styles.frame1}/>
                    <div className={styles.frame2}/>
                    <div className={styles.frame3}/>
                    <div className={styles.frame4}/>
                    <div className={styles.frame5}/>
                </div>
            </div>
        </div>
    );
};

export default Name;
