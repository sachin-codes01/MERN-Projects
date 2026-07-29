import { motion, useScroll, useSpring } from "motion/react";

/**
 * Fixed 2px bar tracking overall page scroll progress, spring-smoothed so
 * it doesn't tick frame-to-frame with raw scroll input.
 */
export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 top-0 z-[60] h-0.5 w-full bg-mdn-green"
      style={{ scaleX, transformOrigin: "left" }}
    />
  );
}
