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
 */
export default function SliderArrow({ direction, onClick }) {
  const Icon = direction === "left" ? ChevronLeftRoundedIcon : ChevronRightRoundedIcon;
  const sideClass = direction === "left" ? "left-0" : "right-0";
  const nudgeClass = direction === "left" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5";

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      aria-label={direction === "left" ? "Previous slide" : "Next slide"}
      className={`group absolute inset-y-0 ${sideClass} z-30 flex w-10 items-center justify-center bg-mdn-green/0 text-white transition-colors duration-300 hover:bg-mdn-green/20 active:bg-mdn-green/40 sm:w-14`}
    >
      <Icon
        sx={{ fontSize: 34 }}
        className={`drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] transition-transform duration-200 ${nudgeClass}`}
      />
    </button>
  );
}
