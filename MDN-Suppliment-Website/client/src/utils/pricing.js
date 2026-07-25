// Size and flavor are independent choices — a size carries the base
// price/discount, a flavor (optional) only ever adds/subtracts a delta on
// top of it. Every place that shows or charges a price should go through
// this so the base size price is never shown/used without the currently
// selected flavor's adjustment applied.
export function getSizePrice(size, flavorAdjustment = 0) {
  const price = size?.price || 0;
  const discountPrice = size?.discountPrice || undefined;
  const basePrice = discountPrice || price;
  const effectivePrice = basePrice + flavorAdjustment;
  const discountPct = discountPrice ? Math.round((1 - discountPrice / price) * 100) : 0;
  return { price, discountPrice, effectivePrice, discountPct };
}
