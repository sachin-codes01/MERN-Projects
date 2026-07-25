// A variant's `price`/`discountPrice` are the base pack-size price; admin
// can additionally set `flavorPriceAdjustment` on a variant so a flavor
// costs more (or less) without re-entering the full price per weight —
// e.g. base 500 + 50 for Chocolate = 550. Every place that shows or
// charges a variant's price should go through this so the base price
// is never shown/used on its own, only the final adjusted number.
export function getVariantPrice(variant) {
  const adjustment = variant?.flavorPriceAdjustment || 0;
  const price = (variant?.price || 0) + adjustment;
  const discountPrice = variant?.discountPrice ? variant.discountPrice + adjustment : undefined;
  const effectivePrice = discountPrice || price;
  const discountPct = discountPrice ? Math.round((1 - discountPrice / price) * 100) : 0;
  return { price, discountPrice, effectivePrice, discountPct };
}
