import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

/**
 * Shared prev/next slider button — used by every carousel on the site so
 * arrow behavior/appearance is identical everywhere.
 *
 * - No circular chip: it's a transparent full-height edge rectangle.
 * - Hover/press use the brand green (not black/gray) — starts a touch
 *   darker on press (`active:`) and settles into a lighter tint on hover,
 *   both using the same theme color instead of an unrelated dark overlay.
 * - `onPointerDown` stops propagation: these buttons sit inside the same
 *   element that handles click-and-drag swiping, and without this the
 *   parent's drag handler was capturing the pointer and swallowing the
 *   button's click — which is why the arrows weren't working.
 * - Hidden below `lg`: on phones/tablets these buttons just get in the
 *   way of finger-swiping, so touch-sized viewports rely on drag only —
 *   arrows only render from `lg` up, where a mouse is the norm.
 */
const SliderArrow = ({ direction, onClick }) => {
  const Icon = direction === "left" ? ChevronLeftRoundedIcon : ChevronRightRoundedIcon;
  const sideClass = direction === "left" ? "left-0" : "right-0";
  const nudgeClass = direction === "left" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5";

  // Redesign: reference jaisa chhota safed gol button, edge ke beech me.
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      aria-label={direction === "left" ? "Previous slide" : "Next slide"}
      className={`group absolute top-1/2 ${sideClass} z-30 mx-2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-mdn-border bg-mdn-charcoal text-mdn-ink shadow transition-colors duration-200 hover:bg-mdn-green hover:text-mdn-on-primary lg:flex`}
    >
      <Icon sx={{ fontSize: 24 }} className={`transition-transform duration-200 ${nudgeClass}`} />
    </button>
  );
};

export default SliderArrow;
