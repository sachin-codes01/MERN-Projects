import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCartBadge } from "../context/CartBadgeContext";
import { useToast } from "../context/ToastContext";
import { guestCart } from "../utils/guestCart";

// Placeholder reviews shown until a real reviews endpoint is wired up.
// Swap this for `product.reviews` from the API once available.
const SAMPLE_REVIEWS = [
  { name: "Arjun T.", rating: 5, text: "Mixes smooth, no chalky aftertaste. Repeat customer." },
  { name: "Sana R.", rating: 4, text: "Great value for the protein content. Wish shipping was a bit faster." },
  { name: "Kabir D.", rating: 5, text: "Been using this for 3 months, noticeable difference in recovery." },
];

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const { token } = useAuth();
  const { markNewItem } = useCartBadge();
  const { success, error: toastError } = useToast();

  useEffect(() => {
    api
      .getProductBySlug(slug)
      .then((data) => {
        setProduct(data.data);
        setSelectedVariant(data.data.variants?.[0]?._id || null);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  const currentVariant = product?.variants.find((v) => v._id === selectedVariant);
  const outOfStock = currentVariant && currentVariant.stock <= 0;

  const handleAddToCart = async () => {
    setMessage("");
    setError("");
    try {
      setAdding(true);
      if (token) {
        await api.addToCart(token, {
          productId: product._id,
          variantId: selectedVariant,
          quantity: 1,
        });
      } else {
        guestCart.addItem({
          productId: product._id,
          variantId: selectedVariant,
          quantity: 1,
          name: product.name,
          image: product.thumbnail,
          price: currentVariant.discountPrice || currentVariant.price,
          slug: product.slug,
          stock: currentVariant.stock,
        });
      }
      markNewItem();
      success(`${product.name} added to cart!`);
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (error && !product) return <p className="mx-auto max-w-7xl px-4 py-10 text-red-400">{error}</p>;
  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-mdn-charcoal2" />
          <div className="space-y-3">
            <div className="h-8 w-2/3 animate-pulse rounded bg-mdn-charcoal2" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-mdn-charcoal2" />
          </div>
        </div>
      </div>
    );
  }

  const avgRating = (SAMPLE_REVIEWS.reduce((s, r) => s + r.rating, 0) / SAMPLE_REVIEWS.length).toFixed(1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="animate-fade-up">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-mdn-green/20 bg-mdn-charcoal2 shadow-green-glow">
            {/* object-contain + padding on purpose — object-cover was
                cropping the tops/bottoms off tall jar-shaped product
                photos. This shows the whole product on a flat surface
                instead. */}
            <img
              src={product.thumbnail}
              alt={product.name}
              onError={(e) => (e.target.style.display = "none")}
              className="h-full w-full object-contain bg-mdn-charcoal2 p-6"
            />
            <span className="absolute left-3 top-3 rounded-full border border-mdn-green/40 bg-mdn-black/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-mdn-green">
              Premium Quality
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="animate-fade-up [animation-delay:100ms]">
          <p className="text-xs font-semibold uppercase tracking-widest text-mdn-green">{product.brand}</p>
          <h1 className="mt-1 text-2xl font-bold text-mdn-white sm:text-3xl">{product.name}</h1>

          <div className="mt-2 flex items-center gap-2">
            <Stars rating={Math.round(avgRating)} />
            <span className="text-sm text-mdn-gray">
              {avgRating} ({SAMPLE_REVIEWS.length} reviews)
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-mdn-gray sm:text-base">{product.description}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="stat-chip">
              <span className="stat-chip-value">{currentVariant?.weight || "—"}</span>
              <span className="stat-chip-label">Weight</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-value">
                ₹{currentVariant?.discountPrice || currentVariant?.price || "—"}
              </span>
              <span className="stat-chip-label">Price</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-value">{outOfStock ? "0" : currentVariant?.stock ?? "—"}</span>
              <span className="stat-chip-label">In Stock</span>
            </div>
          </div>

          <label className="mt-6 block text-sm font-medium text-mdn-white">Choose variant</label>
          <select
            value={selectedVariant || ""}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="input-field mt-2"
          >
            {product.variants.map((v) => (
              <option key={v._id} value={v._id}>
                {v.flavor ? `${v.flavor} - ` : ""}
                {v.weight} - ₹{v.discountPrice || v.price}
                {v.stock <= 0 ? " (Out of stock)" : ""}
              </option>
            ))}
          </select>

          <button
            onClick={handleAddToCart}
            disabled={outOfStock || adding}
            className="btn-primary mt-5 w-full sm:w-auto"
          >
            {outOfStock ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
          </button>

          {message && <p className="mt-3 text-sm text-mdn-green">{message}</p>}
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 border-t border-white/5 pt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-mdn-white sm:text-2xl">
            Customer <span className="text-mdn-green">Reviews</span>
          </h2>
          <div className="flex items-center gap-2">
            <Stars rating={Math.round(avgRating)} />
            <span className="text-sm text-mdn-gray">{avgRating} / 5</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_REVIEWS.map((r, i) => (
            <div key={i} className="card p-5 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <Stars rating={r.rating} />
              <p className="mt-3 text-sm leading-relaxed text-mdn-white/90">"{r.text}"</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-mdn-gray">{r.name}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5 text-mdn-green">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6 5.8 20.7l1.6-6.9L2.1 9.1l7-.7L12 2z" />
        </svg>
      ))}
    </div>
  );
}