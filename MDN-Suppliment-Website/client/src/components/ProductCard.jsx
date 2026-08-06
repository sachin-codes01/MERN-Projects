import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCartBadge } from "../context/CartBadgeContext";
import { useToast } from "../context/ToastContext";
import { guestCart } from "../utils/guestCart";
import { getSizePrice } from "../utils/pricing";
import { getDisplayRating } from "../utils/rating";

function Stars({ stars }) {
  const rounded = Math.max(0, Math.min(5, stars));
  return (
    <div className="flex gap-0.5 text-mdn-star">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={i < rounded ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6 5.8 20.7l1.6-6.9L2.1 9.1l7-.7L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductCard({ product }) {
  const size = product.sizes?.[0];
  // Quick add-to-cart from the listing card has no size/flavor picker, so
  // it defaults to the first of each — same convention as which one shows
  // first on the product detail page.
  const flavor = product.flavors?.[0] || null;
  const outOfStock = !size || size.stock <= 0;
  const { token } = useAuth();
  const { markNewItem } = useCartBadge();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // Admin-set display rating if there is one, else the average of real
  // reviews, else nothing at all — see utils/rating.js. Previously this
  // synthesised a rating from a hash of the product name, so every product
  // showed a plausible-looking score that was pure invention.
  const { value: ratingValue, stars, hasRating } = getDisplayRating(product);
  const showFrom = (product.sizes?.length || 0) > 1;
  const { price, discountPrice, effectivePrice, discountPct } = getSizePrice(size, flavor?.priceAdjustment || 0);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;

    try {
      setAdding(true);
      setError("");
      if (token) {
        await api.addToCart(token, {
          productId: product._id,
          sizeId: size._id,
          flavorId: flavor?._id || null,
          quantity: 1,
        });
      } else {
        guestCart.addItem({
          productId: product._id,
          sizeId: size._id,
          flavorId: flavor?._id || null,
          quantity: 1,
          name: product.name,
          image: product.thumbnail || flavor?.image,
          price: effectivePrice,
          slug: product.slug,
          stock: size.stock,
          flavor: flavor?.name || null,
          weight: size.weight,
          brand: product.brand,
        });
      }
      markNewItem();
      success(`${product.name} added to cart!`);
      navigate("/cart");
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className={`card group relative z-0 flex flex-col overflow-hidden transition-all duration-300 hover:z-10 hover:-translate-y-1 hover:border-mdn-green/50 hover:shadow-green-glow ${
        outOfStock ? "opacity-60" : ""
      }`}
    >
      {/* object-fill, NOT object-cover: cover crops whichever edge doesn't
          match the square box, which was cutting lids and label text off
          the taller product shots. Fill shows the WHOLE image and stretches
          it to the box instead — so nothing is ever hidden, at the cost of
          some distortion on photos that aren't square. Hover zoom is
          softened to 1.05 (was 1.10) to keep that stretch from being
          exaggerated on hover. */}
      <div className="relative aspect-square overflow-hidden bg-mdn-charcoal2">
        <img
          src={product.thumbnail}
          alt={product.name}
          onError={(e) => (e.target.style.display = "none")}
          className="h-full w-full object-fill transition-transform duration-500 group-hover:scale-105"
        />
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-md bg-mdn-black/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-400">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        {/* Name first, then rating — matching the reference card order.
            `line-clamp-2` (not 1) because at this width most names run to
            two lines; clamping to one was cutting "MDN Hydroxy Fat Cutter
            Pro" mid-word. */}
        {/* font-body overrides the Didot default that h1-h4 inherit —
            product names read as normal sans here, not display serif. */}
        <h3 className="line-clamp-2 font-body text-sm font-semibold leading-snug text-mdn-white">
          {product.name}
        </h3>

        {hasRating && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Stars stars={stars} />
            <span className="text-[11px] font-medium text-mdn-ink-muted">({ratingValue.toFixed(1)})</span>
          </div>
        )}

        {/* Always renders — price line and button below are never
            conditionally omitted, only their label/disabled state changes.
            Skipping them for out-of-stock cards used to make those cards
            shorter than in-stock ones, breaking the grid row's alignment. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {size ? (
            <>
              <p className="font-mono text-sm font-bold text-mdn-green">
                {showFrom && <span className="mr-1 text-xs font-medium text-mdn-gray">From</span>}
                ₹{effectivePrice}
                {discountPrice && (
                  <span className="ml-2 text-xs font-medium text-mdn-gray line-through">₹{price}</span>
                )}
              </p>
              {/* Discount pill, e.g. "24% OFF". getSizePrice already
                  derives the percentage from price vs discountPrice, so
                  this reads real catalogue data rather than a hardcoded
                  number, and disappears on products with no discount. */}
              {discountPct > 0 && <span className="badge-save">{discountPct}% OFF</span>}
            </>
          ) : (
            <span className="text-xs font-medium text-mdn-gray">Price unavailable</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={adding || outOfStock}
          // Green at rest, orange on hover/press. Was a fixed near-black
          // (#14151a) left over from the dark theme, which read as a
          // neutral UI button rather than the brand's primary action —
          // the reference sets this as a solid forest-green bar under
          // every product card. Orange is the interaction state here
          // specifically because this button is already green: a green
          // hover on a green fill would give no feedback at all.
          // `active:` matches hover so a tap on touch (where :hover is
          // suppressed) still confirms the press.
          className="mt-3 w-full rounded-sm bg-mdn-green py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-all duration-200 hover:bg-mdn-orange-solid active:bg-mdn-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {outOfStock ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
        </button>
        {error && <span className="mt-1 text-xs text-red-400">{error}</span>}
      </div>
    </Link>
  );
}
