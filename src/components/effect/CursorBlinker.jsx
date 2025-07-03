import React from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export default function CursorBlinker() {
  const [parentRef] = useAutoAnimate();
  
  return (
    <div ref={parentRef} className="blink animate-blink" />
  );
}