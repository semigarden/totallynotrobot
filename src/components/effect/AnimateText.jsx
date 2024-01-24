import React, { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
// eslint-disable-next-line
import CursorBlinker from "./CursorBlinker";

const AnimateText = ({ text }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));
    const displayText = useTransform(rounded, (latest) =>
    text.slice(0, latest)
    );

    useEffect(() => {
        const controls = animate(count, text.length, {
            type: "tween",
            delay: 3,
            duration: 8,
            ease: "easeInOut",
        });

        return controls.stop;
    }, [text.length, count]);

    return (
        <div className="character-class-bio">
            <motion.div>{displayText}</motion.div>
            {/* <CursorBlinker /> */}
        </div>
    );
};

export default AnimateText;