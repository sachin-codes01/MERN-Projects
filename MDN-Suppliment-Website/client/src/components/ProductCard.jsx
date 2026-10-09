import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCartBadge } from "../context/CartBadgeContext";
import { useToast } from "../context/ToastContext";
import { guestCart } from "../utils/guestCart";
import { getSizePrice } from "../utils/pricing";
import { getDisplayRating } from "../utils/rating";

const Stars = ({ stars }) => {
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
};

const ProductCard = ({ product }) => {
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
      className={`lift group relative z-0 flex h-full flex-col overflow-hidden rounded-xl border border-mdn-border bg-mdn-charcoal shadow-xs hover:z-10 ${
        outOfStock ? "opacity-60" : ""
      }`}
    >
      {/* Image — object-fill (pehle ki request), hover pe halka zoom */}
      <div className="relative aspect-square overflow-hidden bg-mdn-sand">
        <img
          src={product.thumbnail}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(e) => (e.target.style.display = "none")}
          className="h-full w-full object-fill transition-transform duration-700 ease-brand-out group-hover:scale-[1.06]"
        />
        {/* Reference ka "Deal" jaisa corner badge — real discount % se */}
        {!outOfStock && size && discountPct > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-mdn-orange-badge px-1.5 py-0.5 text-[10px] font-bold text-mdn-badge-ink shadow-xs sm:left-3 sm:top-3 sm:px-2 sm:text-xs">
            {discountPct}% OFF
          </span>
        )}
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-md bg-mdn-charcoal/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mdn-danger shadow-xs sm:left-2.5 sm:top-2.5">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
        {/* Naam pehle, phir rating — reference card order. Phone pe (2 cards/row,
            naam aksar wrap hote hain) 2 line ki jagah reserve — taaki row ke dono
            cards ke price ek line me rahein. Bade screen pe reserve nahi (khaali patti). */}
        <h3 className="line-clamp-2 min-h-[2.5em] font-heading text-[12.5px] font-semibold leading-[1.25] text-mdn-ink sm:min-h-0 sm:text-[15px]">
          {product.name}
        </h3>

        {/* Rating sirf tab jab ho — khaali row se naam aur price ke beech faltu gap banta tha */}
        {hasRating && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Stars stars={stars} />
            <span className="text-[11px] font-medium text-mdn-ink-muted sm:text-xs">{ratingValue.toFixed(1)}</span>
          </div>
        )}

        {/* Price row: ₹final  ₹MRP(strike)  xx% off */}
        <div className="mt-1.5 flex flex-nowrap items-baseline gap-x-1.5 sm:flex-wrap sm:gap-y-0.5">
          {size ? (
            <>
              {showFrom && <span className="text-[10px] font-medium text-mdn-ink-muted sm:text-[11px]">From</span>}
              <span className="font-heading text-[15px] font-bold tabular-nums leading-none text-mdn-ink sm:text-lg">
                ₹{effectivePrice}
              </span>
              {discountPrice && (
                <span className="truncate text-[11px] tabular-nums text-mdn-ink-muted line-through sm:text-[13px]">₹{price}</span>
              )}
              {discountPct > 0 && (
                // Phone pe chhupa — wahi % image ke badge pe already hai, aur yahan line wrap karta tha
                <span className="hidden text-xs font-semibold text-mdn-orange-ink sm:inline sm:text-[13px]">{discountPct}% off</span>
              )}
            </>
          ) : (
            <span className="text-xs font-medium text-mdn-ink-muted">Price unavailable</span>
          )}
        </div>

        {/* mt-auto: button hamesha card ke bottom pe, chahe naam 1 line ho ya 2 */}
        <div className="mt-auto pt-3">
          <button
            onClick={handleAddToCart}
            disabled={adding || outOfStock}
            className="btn-shine btn-shine-loop press flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg bg-mdn-green py-2 font-heading text-[12px] font-semibold sm:min-h-[42px] sm:py-2.5 text-mdn-on-primary transition-colors duration-200 hover:bg-mdn-orange-solid hover:text-white active:bg-mdn-orange-hover disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          >
            {/* Text se pehle chhota cart icon (out of stock pe nahi) */}
            {!outOfStock && (
              <svg
                aria-hidden="true"
                className="h-[15px] w-[15px] flex-shrink-0 sm:h-[17px] sm:w-[17px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="18" cy="20" r="1.4" />
                <path d="M2.5 3.5h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.2l1.7-7.3H6.2" />
              </svg>
            )}
            {outOfStock ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
          </button>
        </div>
        {error && <span className="mt-1 text-xs text-mdn-danger">{error}</span>}
      </div>
    </Link>
  );
};

export default ProductCard;
