import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

// Number view me aate hi gin-ti karta hai ("37" → 0..37, "5x" → 0..5 + "x").
// Bade saal (2001) 0 se nahi, thoda pehle se shuru hote hain — warna ajeeb lagta hai.
// Reduced motion pe seedha final value dikhti hai.
const CountUp = ({ value, duration = 1.4, className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const match = String(value).match(/^(\d+)(.*)$/);
  const target = match ? Number(match[1]) : null;
  const suffix = match ? match[2] : "";
  const start = target > 1000 ? target - 40 : 0;
  const [shown, setShown] = useState(target === null || reduce ? value : `${start}${suffix}`);

  useEffect(() => {
    if (!inView || target === null || reduce) return;
    const controls = animate(start, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(`${Math.round(v)}${suffix}`),
    });
    return () => controls.stop();
  }, [inView, target, start, suffix, duration, reduce]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {shown}
    </span>
  );
};

export default CountUp;
