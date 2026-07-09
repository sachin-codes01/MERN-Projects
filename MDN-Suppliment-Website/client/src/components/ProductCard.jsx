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
    <Link
      to={`/products/${product.slug}`}
      className={`card group relative flex flex-col overflow-hidden p-3 hover:-translate-y-1 hover:shadow-green-glow ${
        outOfStock ? "opacity-60" : ""
      }`}
    >
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