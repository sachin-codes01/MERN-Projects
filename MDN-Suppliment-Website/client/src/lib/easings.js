// Shared easing curves for the scroll-motion system. Both are fast-start,
// long-soft-landing curves — do NOT substitute easeInOut, it reads as
// mechanical rather than the "arriving" feel these are tuned for.

// General reveals (Reveal, Parallax-adjacent fades).
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1];

// Text mask wipes (MaskReveal) — a touch snappier off the start than
// the quint above, which suits a clipped line sliding out from behind
// its mask rather than a whole element drifting in.
export const EASE_OUT_EXPO = [0.19, 1, 0.22, 1];
