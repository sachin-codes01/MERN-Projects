import { useEffect, useState } from "react";
import { getVariantPrice } from "../utils/pricing";

/**
 * Fixed "Add to Cart" bar — shown on every screen size (not just
 * mobile). Only appears once the real Add to Cart button (`atcRef`) has
 * scrolled OFF THE TOP of the viewport (the user actively scrolled past
 * it), and hides again either when that real button scrolls back into
 * view or when the site footer (`#site-footer`, see Footer.jsx) enters
 * the viewport — so it never sits on top of the footer.
 *
 * Deliberately NOT just "button not intersecting" — on a short viewport
 * the button can start below the fold before any scrolling happens at
 * all, which made this bar appear immediately on load. Checking
 * `boundingClientRect.top < 0` distinguishes "scrolled past above" from
 * "hasn't been scrolled to yet".
 */
export default function StickyAddToCart({ atcRef, product, currentVariant, outOfStock, adding, onAddToCart }) {
  const [scrolledPastAtc, setScrolledPastAtc] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const atcEl = atcRef.current;
    const footerEl = document.getElementById("site-footer");
    if (!atcEl) return;

    const atcObserver = new IntersectionObserver(
      ([entry]) => {
        setScrolledPastAtc(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    atcObserver.observe(atcEl);

    let footerObserver;
    if (footerEl) {
      footerObserver = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting), {
        threshold: 0,
      });
      footerObserver.observe(footerEl);
    }

    return () => {
      atcObserver.disconnect();
      footerObserver?.disconnect();
    };
  }, [atcRef]);

  const show = scrolledPastAtc && !footerVisible;
  const { price, discountPrice, effectivePrice, discountPct: pct } = getVariantPrice(currentVariant);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-mdn-black/95 backdrop-blur transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="h-11 w-11 shrink-0 rounded-lg bg-mdn-charcoal2 object-contain"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-mdn-white">{product.name}</p>
          {currentVariant && (
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
          {outOfStock ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
