import React, { useEffect, useState } from "react";
import { animate, useMotionValue } from "framer-motion";

/**
 * Counts up from 0 to `value` whenever value changes. Used for dashboard
 * stats so numbers feel alive on load rather than just appearing.
 */
export default function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString(), duration = 0.9 }) {
  const [display, setDisplay] = useState(0);
  const motionVal = useMotionValue(0);

  useEffect(() => {
    const numeric = Number(value) || 0;
    const controls = animate(motionVal, numeric, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{format(display)}</>;
}
