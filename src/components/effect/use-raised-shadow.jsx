import { useEffect, useState } from "react";

const inactiveShadow = "0px 0px 0px rgba(0,0,0,0.8)";
const activeShadow = "5px 5px 10px rgba(0,0,0,0.3)";

export function useRaisedShadow(value) {
  const [boxShadow, setBoxShadow] = useState(inactiveShadow);

  useEffect(() => {
    let isActive = false;
    const unsubscribe = value.on("change", (latest) => {
      const wasActive = isActive;
      if (latest !== 0) {
        isActive = true;
        if (isActive !== wasActive) {
          setBoxShadow(activeShadow);
        }
      } else {
        isActive = false;
        if (isActive !== wasActive) {
          setBoxShadow(inactiveShadow);
        }
      }
    });

    return unsubscribe;
  }, [value]);

  return boxShadow;
}