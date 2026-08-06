/**
 * Single source of truth for what rating a product shows.
 *
 * Both the product card and the product detail page read this, so the two
 * can never disagree — previously the card synthesised a deterministic
 * pseudo-rating from the product name while the detail page printed the
 * real average, and the same product could show 4.6 in a grid and 4.3 on
 * its own page.
 *
 * Precedence:
 *   1. Admin-set values (`manualRating` / `manualStars`) when present.
 *   2. Otherwise the average computed from real customer reviews.
 *   3. Otherwise nothing — `hasRating` is false and callers render no
 *      stars at all. Nothing is fabricated on the client.
 *
 * `count` is ALWAYS the real review count. It is never taken from an
 * admin field, so "N Reviews" can only ever reflect actual reviews.
 */
export function getDisplayRating(product) {
  const count = product?.ratingsCount || 0;
  const realAverage = count > 0 ? product?.ratingsAverage || 0 : 0;

  // Admin value wins when set (> 0 means "set"; 0 is the schema default).
  const value = product?.manualRating > 0 ? product.manualRating : realAverage;

  // Star fill: the admin's explicit choice, else derived from the value.
  const stars = product?.manualStars > 0 ? product.manualStars : Math.round(value);

  return {
    value,                       // e.g. 4.3 — the number to print
    stars,                       // 0–5 — how many stars to fill
    count,                       // real review count, for "N Reviews"
    hasRating: value > 0,        // false -> render no rating at all
  };
}

/** "1 Review" / "24 Reviews" / "0 Reviews" */
export const reviewCountLabel = (count) => `${count} ${count === 1 ? "Review" : "Reviews"}`;
