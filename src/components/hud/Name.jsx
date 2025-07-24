import React, { useEffect, useRef } from 'react';
import styles from "@/styles/hud/Name.module.scss";

const Name = ({ className, name = "Faulty Circuit" }) => {
    const animationRef = useRef(null);

    useEffect(() => {
        const arrows = animationRef.current?.querySelectorAll(`.${styles.arrow}`);
        if (arrows) {
            arrows.forEach((arrow, index) => {
                arrow.style.animationDelay = `${index * 0.1}s`;
            });
        }
    }, []);

    return (
        <div className={`${styles.name} ${className}`}>
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
                    <div className={styles.frame1} augmented-ui="tl-clip exe"/>
                    <div className={styles.line1} augmented-ui="tl-clip exe"/>
                    <div className={styles.line2}/>
                    <div className={styles.frame2} augmented-ui="br-clip exe"/>
                    <div className={styles.frame3} augmented-ui="tl-clip tr-clip exe"/>
                </div>
                <div className={styles.frameMain}>
                    <div className={styles.text}>{name}</div>
                    <div className={styles.animation} ref={animationRef}>
                        {Array.from({length: 16}).map((_, index) => (
                            <div className={styles.arrow} key={index}>
                                <div className={styles.line1} augmented-ui="tr-clip bl-clip exe"/>
                                <div className={styles.line2} augmented-ui="br-clip tl-clip exe"/>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.frameBottom}>
                    <div className={styles.frame1} augmented-ui="tl-clip br-clip exe"/>
                    <div className={styles.frame2} augmented-ui="br-clip exe"/>
                    <div className={styles.frame3} augmented-ui="tl-clip br-clip exe"/>
                    <div className={styles.frame4} augmented-ui="br-clip tl-clip exe"/>
                    <div className={styles.frame5} augmented-ui="br-clip exe"/>
                </div>
            </div>
        </div>
    );
};

export default Name;
