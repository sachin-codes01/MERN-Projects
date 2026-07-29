import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/**
 * Vertical parallax drift for a full-bleed image band. The image is
 * scaled up (1.16) and sits inside an `overflow-hidden` parent — without
 * both, the ±8% drift exposes empty edges at the top/bottom of the frame.
 *
 * Usage: wrap the image (or whatever should drift) as children; this
 * component supplies the overflow-hidden frame, the scroll tracking, and
 * the scale — you don't need to add either yourself.
 */
export default function Parallax({ children, className = "", range = ["-8%", "8%"] }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], range);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div className="h-full w-full scale-[1.16]" style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}
