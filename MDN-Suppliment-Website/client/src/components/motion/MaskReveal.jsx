import { motion } from "motion/react";
import { EASE_OUT_EXPO } from "../../lib/easings";

/**
 * Text wipes up from behind a clipping edge, one line at a time. Each
 * entry in `lines` can be a plain string or arbitrary JSX (e.g. a line
 * with an inline colored span) — it's rendered as-is inside the animated
 * child.
 *
 * Structure per line: an `overflow-hidden` wrapper (the clip edge)
 * containing a child that animates translateY(110%) -> 0. The wrapper
 * carries a little padding-bottom so descenders/apostrophes aren't
 * sheared off by the clip.
 */
export default function MaskReveal({
  lines,
  delay = 0,
  stagger = 0.09,
  duration = 0.9,
  amount = 0.6,
  as: Component = "div",
  lineClassName = "",
  className = "",
}) {
  const MotionComponent = motion[Component] ?? motion.div;

  return (
    <MotionComponent
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
    >
      {lines.map((line, i) => (
        <span
          key={i}
          className={`block overflow-hidden pb-[0.04em] ${lineClassName}`}
        >
          <motion.span
            className="block"
            variants={{
              hidden: { y: "110%" },
              visible: { y: "0%" },
            }}
            transition={{
              duration,
              delay: delay + i * stagger,
              ease: EASE_OUT_EXPO,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </MotionComponent>
  );
}
