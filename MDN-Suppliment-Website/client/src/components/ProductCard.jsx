import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCartBadge } from "../context/CartBadgeContext";
import { useToast } from "../context/ToastContext";
import { guestCart } from "../utils/guestCart";

export default function ProductCard({ product }) {
  const variant = product.variants?.[0];
  const outOfStock = !variant || variant.stock <= 0;
  const { token } = useAuth();
  const { markNewItem } = useCartBadge();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [justAdded, setJustAdded] = useState(false);

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
          variantId: variant._id,
          quantity: 1,
        });
      } else {
        guestCart.addItem({
          productId: product._id,
          variantId: variant._id,
          quantity: 1,
          name: product.name,
          image: product.thumbnail,
          price: variant.discountPrice || variant.price,
          slug: product.slug,
          stock: variant.stock,
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
    /* FIX: `overflow-hidden` removed from this outer element.
       It used to sit here alongside `hover:-translate-y-1` (a transform)
       and `hover:shadow-green-glow` (a shadow that needs room OUTSIDE the
       box to render). overflow-hidden clips anything outside its own box
       — including its own border and glow — so on hover, as the card
       shifted up, that self-clipped edge showed up as a cropped/cut
       border. The image's own rounding+clipping now happens on the inner
       wrapper below instead, where it belongs; this outer box just moves
       and glows, nothing about it gets clipped anymore.
       Added `relative z-0 hover:z-10` too, so the lifted card renders
       above its grid neighbors instead of tucking behind them. */
    <Link
  to={`/products/${product.slug}`}
  className={`card group relative z-0 flex flex-col p-3 transition-all duration-300 hover:z-10 hover:scale-[1.03] hover:border-mdn-green/50 hover:shadow-green-glow ${
    outOfStock ? "opacity-60" : ""
  }`}
>
      {/* overflow-hidden lives here now — a static container (no transform
          of its own) clipping only its child <img>'s zoom. Nothing above
          it is also transformed+clipped, so there's no seam/crop glitch. */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-mdn-charcoal2">
        <img
          src={product.thumbnail}
          alt={product.name}
          onError={(e) => (e.target.style.display = "none")}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-md bg-mdn-black/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-400">
            Out of stock
          </span>
        )}
      </div>

      <h3 className="mt-3 line-clamp-1 text-sm font-semibold text-mdn-white">{product.name}</h3>
      <p className="text-xs text-mdn-gray">{product.brand}</p>

      {variant && (
        <p className="mt-1 font-mono text-sm font-bold text-mdn-green">
          ₹{variant.discountPrice || variant.price}
          {variant.discountPrice && (
            <span className="ml-2 text-xs font-medium text-mdn-gray line-through">₹{variant.price}</span>
          )}
        </p>
      )}

      {!outOfStock && (
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className={`btn-primary mt-3 w-full !py-2 text-xs transition-transform ${
            justAdded ? "animate-pop" : ""
          }`}
        >
          {adding ? "Adding..." : justAdded ? "Added ✓" : "Add to Cart"}
        </button>
      )}
      {error && <span className="mt-1 text-xs text-red-400">{error}</span>}
    </Link>
  );
}