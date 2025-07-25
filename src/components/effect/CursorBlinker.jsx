import React from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import styles from "@/styles/Panel.module.scss";

const CursorBlinker = () => {
  const [parentRef] = useAutoAnimate();
  
  return (
    <div ref={parentRef} className={`${styles.blink} ${styles.animateBlink}`} />
  );
}

export default CursorBlinker;
