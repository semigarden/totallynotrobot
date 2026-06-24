import { useEffect, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

import CursorBlinker from "./CursorBlinker";
import styles from "@/styles/Panel.module.scss";

const AnimateText = ({ text, className = "" }) => {
    const [displayText, setDisplayText] = useState("");
    const [parentRef] = useAutoAnimate();

    useEffect(() => {
        let currentIndex = 0;
        const delay = 1000;
        const duration = 2000;
        const interval = duration / text.length;

        const timer = setTimeout(() => {
            const typewriterInterval = setInterval(() => {
                if (currentIndex <= text.length) {
                    setDisplayText(text.slice(0, currentIndex));
                    currentIndex++;
                } else {
                    clearInterval(typewriterInterval);
                }
            }, interval);

            return () => clearInterval(typewriterInterval);
        }, delay);

        return () => clearTimeout(timer);
    }, [text]);

    return (
        <div ref={parentRef} className={`${styles.text} ${className}`}>
            <div className={styles.placeholder}>{text}</div>
            <div className={styles.text}>{displayText}</div>
            
        </div>
    );
};

export default AnimateText;
