import { motion } from "motion/react";
import { EASE_OUT_QUINT } from "../../lib/easings";

// Offsets are big enough to read as arriving from OUTSIDE the layout, not
// nudging into place — see the note on the component below.
// Phone pe movement chhota rakha hai — chhoti screen pe 90px ka jump "udta hua" lagta tha.
// Module load pe ek baar check (har Reveal pe listener lagana mehenga padta).
const SMALL = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
const D = SMALL ? 16 : 28;
const X = SMALL ? 20 : 40;

const VARIANTS = {
  up: { hidden: { opacity: 0, y: D }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -D }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -X }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: X }, visible: { opacity: 1, x: 0 } },
  fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  scale: { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 } },
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
const Reveal = ({
  children,
  from = "up",
  delay = 0,
  duration = 0.7,
  amount = 0.25,
  as: Component = "div",
  className = "",
  // Everything else is forwarded to the underlying motion element.
  // Without this, wrapping an existing element in a Reveal SILENTLY
  // dropped its handlers — the reviews carousel pauses its autoplay on
  // onMouseEnter/onMouseLeave, and moving those onto a Reveal would have
  // thrown them away with no error, leaving a carousel that no longer
  // pauses under the pointer.
  ...rest
}) => {
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
      {...rest}
    >
      {children}
    </MotionComponent>
  );
};

export default Reveal;
