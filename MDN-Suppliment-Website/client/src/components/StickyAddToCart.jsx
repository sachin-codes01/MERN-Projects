import { useEffect, useState } from "react";
import { getSizePrice } from "../utils/pricing";

/**
 * Fixed "Add to Cart" bar at the bottom of the viewport — shown on every
 * screen size. Bar sirf tab dikhta hai jab user asli Add to Cart button
 * (`atcRef`) se NEECHE scroll kar chuka ho (button screen ke upar nikal gaya).
 * Button dikh raha ho, ya abhi uske upar hi ho (button neeche hai) — bar chhupa.
 *
 * Footer ke neeche thodi jagah reserve hoti hai (`has-sticky-atc`, see
 * index.css) taaki page ke end pe bar footer ki aakhri line ko na dhake.
 */
const StickyAddToCart = ({ atcRef, product, currentSize, currentFlavor, outOfStock, adding, onAddToCart }) => {
  const [scrolledPastAtc, setScrolledPastAtc] = useState(false);

  useEffect(() => {
    const atcEl = atcRef.current;
    if (!atcEl) return;
    // top < 0 = button screen ke upar chala gaya (user uske neeche hai)
    const atcObserver = new IntersectionObserver(
      ([entry]) => setScrolledPastAtc(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    atcObserver.observe(atcEl);
    return () => atcObserver.disconnect();
  }, [atcRef]);

  const show = scrolledPastAtc;

  // Reserve room at the bottom of the footer while the bar is up, and
  // always release it when this page unmounts.
  useEffect(() => {
    const footerEl = document.getElementById("site-footer");
    if (!footerEl) return;
    footerEl.classList.toggle("has-sticky-atc", show);
    return () => footerEl.classList.remove("has-sticky-atc");
  }, [show]);

  const { price, discountPrice, effectivePrice, discountPct: pct } = getSizePrice(
    currentSize,
    currentFlavor?.priceAdjustment || 0
  );

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-mdn-border bg-mdn-charcoal/95 shadow-lg backdrop-blur transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Phone pe compact: chhota thumbnail, ek line naam, ek line price, chhota button */}
      <div className="mx-auto flex max-w-shell items-center gap-2.5 px-4 py-2.5 sm:gap-3 sm:px-6 sm:py-3 lg:px-[34px]">
        <img
          src={currentFlavor?.images?.[0] || product.thumbnail}
          alt={product.name}
          className="h-10 w-10 shrink-0 rounded-lg bg-mdn-sand object-contain sm:h-11 sm:w-11"
        />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-heading text-[12px] font-semibold text-mdn-ink sm:text-sm">{product.name}</p>
          {currentSize && (
            <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap tabular-nums">
              <span className="font-heading text-[13px] font-bold text-mdn-ink sm:text-[15px]">₹{effectivePrice}</span>
              {discountPrice && (
                <span className="text-[10.5px] text-mdn-ink-muted line-through sm:text-xs">₹{price}</span>
              )}
              {pct > 0 && (
                <span className="rounded-full bg-mdn-orange-badge px-1.5 py-px text-[9.5px] font-bold leading-4 text-mdn-badge-ink sm:text-[10px]">
                  {pct}% off
                </span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={onAddToCart}
          disabled={outOfStock || adding}
          className="btn-primary shrink-0 !min-h-[40px] !px-4 !py-2 !text-[13px] sm:!min-h-[44px] sm:!px-6 sm:!text-sm"
        >
          {!currentSize
            ? "Unavailable"
            : outOfStock
            ? "Out of Stock"
            : adding
            ? "Adding..."
            : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

export default StickyAddToCart;
