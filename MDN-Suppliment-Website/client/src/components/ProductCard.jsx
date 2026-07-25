import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCartBadge } from "../context/CartBadgeContext";
import { useToast } from "../context/ToastContext";
import { guestCart } from "../utils/guestCart";
import { getSizePrice } from "../utils/pricing";

// Deterministic per-product rating (4.00–4.89) used only when the product
// itself doesn't carry a real `rating` field yet. No fabricated review
// COUNT is shown — just the stars — so nothing here claims a specific
// number of reviews that doesn't exist in your data.
function pseudoRating(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  return 4 + (hash % 90) / 100;
}

function Stars({ rating }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex gap-0.5 text-mdn-green">
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
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [justAdded, setJustAdded] = useState(false);

  // Product schema stores ratingsAverage/ratingsCount (there's no `rating`
  // field) — use the real average once the product has reviews, otherwise
  // fall back to the deterministic placeholder.
  const rating =
    product.ratingsCount > 0 ? product.ratingsAverage : pseudoRating(product.name || product._id || "");
  const showFrom = (product.sizes?.length || 0) > 1;
  const { price, discountPrice, effectivePrice } = getSizePrice(size, flavor?.priceAdjustment || 0);

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
          image: flavor?.image || product.thumbnail,
          price: effectivePrice,
          slug: product.slug,
          stock: size.stock,
          flavor: flavor?.name || null,
          weight: size.weight,
          brand: product.brand,
        });
      }
      markNewItem();
      setJustAdded(true);
      success(`${product.name} added to cart!`);
      setTimeout(() => setJustAdded(false), 1200);
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
      {/* Image fills the box completely (object-cover, no inset padding)
          and is perfectly centered — this is what makes the hover zoom
          feel clean edge-to-edge instead of zooming a smaller inset photo. */}
      <div className="relative aspect-square overflow-hidden bg-mdn-charcoal2">
        <img
          src={product.thumbnail}
          alt={product.name}
          onError={(e) => (e.target.style.display = "none")}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
        />
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-md bg-mdn-black/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-400">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <Stars rating={rating} />
        <h3 className="mt-1.5 line-clamp-1 text-sm font-semibold text-mdn-white">{product.name}</h3>
        <p className="text-xs text-mdn-gray">{product.brand}</p>

        {/* Always renders — price line and button below are never
            conditionally omitted, only their label/disabled state changes.
            Skipping them for out-of-stock cards used to make those cards
            shorter than in-stock ones, breaking the grid row's alignment. */}
        <p className="mt-1.5 font-mono text-sm font-bold text-mdn-green">
          {size ? (
            <>
              {showFrom && <span className="mr-1 text-xs font-medium text-mdn-gray">From</span>}
              ₹{effectivePrice}
              {discountPrice && <span className="ml-2 text-xs font-medium text-mdn-gray line-through">₹{price}</span>}
            </>
          ) : (
            <span className="text-xs font-medium text-mdn-gray">Price unavailable</span>
          )}
        </p>

        <button
          onClick={handleAddToCart}
          disabled={adding || outOfStock}
          // Fixed dark button regardless of light/dark theme — matches the
          // reference card's solid dark "View Product" button, while
          // keeping this one functional as Add to Cart.
          className={`mt-3 w-full rounded-lg bg-[#14151a] py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-all duration-200 hover:bg-mdn-green hover:text-black disabled:cursor-not-allowed disabled:opacity-60 ${
            justAdded ? "animate-pop" : ""
          }`}
        >
          {outOfStock ? "Out of Stock" : adding ? "Adding..." : justAdded ? "Added ✓" : "Add to Cart"}
        </button>
        {error && <span className="mt-1 text-xs text-red-400">{error}</span>}
      </div>
    </Link>
  );
}
