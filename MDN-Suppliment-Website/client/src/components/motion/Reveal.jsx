import { motion } from "motion/react";
import { EASE_OUT_QUINT } from "../../lib/easings";

// Offsets are big enough to read as arriving from OUTSIDE the layout, not
// nudging into place — see the note on the component below.
const VARIANTS = {
  up: { hidden: { opacity: 0, y: 90 }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -90 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -120 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 120 }, visible: { opacity: 1, x: 0 } },
  fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  scale: { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } },
};

/**
 * Directional scroll reveal — animates its children in once they scroll
 * into view. `from` should FOLLOW THE LAYOUT (left column enters from the
 * left, right column from the right, images scale up) rather than using
 * the same direction everywhere, which reads as generic.
 *
 * Fires once (`viewport={{ once: true }}`) and stays revealed — this is a
 * one-way entrance, not a scrubbed/looping effect.
 */
export default function Reveal({
  children,
  from = "up",
  delay = 0,
  duration = 0.9,
  amount = 0.25,
  as: Component = "div",
  className = "",
}) {
  const MotionComponent = motion[Component] ?? motion.div;
  const variants = VARIANTS[from] ?? VARIANTS.up;

  return (
    <MotionComponent
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={variants}
      transition={{ duration, delay, ease: EASE_OUT_QUINT }}
    >
      {children}
    </MotionComponent>
  );
}
