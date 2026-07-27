import { useEffect, useState } from "react";
import { getSizePrice } from "../utils/pricing";

/**
 * Fixed "Add to Cart" bar — shown on every screen size (not just
 * mobile). Appears once the real Add to Cart button (`atcRef`) has
 * scrolled OFF THE TOP of the viewport (the user actively scrolled past
 * it), and hides again when that button scrolls back into view.
 *
 * It deliberately stays up over the site footer too, so the bar is still
 * reachable at the very bottom of the page. To keep it from covering the
 * footer's last rows, the footer gets extra bottom padding (via the
 * `has-sticky-atc` class, see index.css) for as long as the bar is up.
 *
 * Deliberately NOT just "button not intersecting" — on a short viewport
 * the button can start below the fold before any scrolling happens at
 * all, which made this bar appear immediately on load. Checking
 * `boundingClientRect.top < 0` distinguishes "scrolled past above" from
 * "hasn't been scrolled to yet".
 */
export default function StickyAddToCart({ atcRef, product, currentSize, currentFlavor, outOfStock, adding, onAddToCart }) {
  const [scrolledPastAtc, setScrolledPastAtc] = useState(false);

  useEffect(() => {
    const atcEl = atcRef.current;
    if (!atcEl) return;

    const atcObserver = new IntersectionObserver(
      ([entry]) => {
        setScrolledPastAtc(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
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
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-mdn-black/95 backdrop-blur transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-shell items-center gap-3 px-4 sm:px-6 lg:px-[34px] py-3">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="h-11 w-11 shrink-0 rounded-lg bg-mdn-charcoal2 object-contain"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-mdn-white">{product.name}</p>
          {currentSize && (
            <p className="flex items-center gap-1.5 font-mono text-sm font-bold text-mdn-green">
              ₹{effectivePrice}
              {discountPrice && <span className="text-xs font-medium text-mdn-gray line-through">₹{price}</span>}
              {pct > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {pct}% off
                </span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={onAddToCart}
          disabled={outOfStock || adding}
          className="btn-primary shrink-0 !px-4 !py-2 text-sm"
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
}
