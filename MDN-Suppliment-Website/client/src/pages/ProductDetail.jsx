import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCartBadge } from "../context/CartBadgeContext";
import { useToast } from "../context/ToastContext";
import { guestCart } from "../utils/guestCart";
import Carousel from "../components/Carousel";
import Accordion from "../components/Accordion";
import ProductReviews from "../components/ProductReviews";
import StickyAddToCart from "../components/StickyAddToCart";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { getVariantPrice } from "../utils/pricing";

const perServing = (v, effectivePrice) => (v.servings ? Math.round(effectivePrice / v.servings) : null);

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const { token } = useAuth();
  const { markNewItem } = useCartBadge();
  const { success, error: toastError } = useToast();
  const atcRef = useRef(null);

  useEffect(() => {
    api
      .getProductBySlug(slug)
      .then((data) => {
        setProduct(data.data);
        const firstVariant = data.data.variants?.[0];
        setSelectedFlavor(firstVariant?.flavor || null);
        setSelectedVariant(firstVariant?._id || null);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  // Unique flavors (in first-appearance order), each carrying its swatch
  // photo — only rendered as a picker row when there's more than one.
  const flavors = [];
  const seenFlavors = new Set();
  for (const v of product?.variants || []) {
    if (v.flavor && !seenFlavors.has(v.flavor)) {
      seenFlavors.add(v.flavor);
      flavors.push({ flavor: v.flavor, image: v.flavorImage });
    }
  }

  const variantsForFlavor =
    flavors.length > 0
      ? product?.variants?.filter((v) => v.flavor === selectedFlavor)
      : product?.variants || [];

  const currentVariant = product?.variants?.find((v) => v._id === selectedVariant);
  const outOfStock = currentVariant && currentVariant.stock <= 0;

  const handleSelectFlavor = (flavor) => {
    setSelectedFlavor(flavor);
    const match = product.variants.find((v) => v.flavor === flavor);
    if (match) setSelectedVariant(match._id);
  };

  const handleAddToCart = async () => {
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
          image: currentVariant.flavorImage || product.thumbnail,
          price: getVariantPrice(currentVariant).effectivePrice,
          slug: product.slug,
          stock: currentVariant.stock,
          flavor: currentVariant.flavor,
          weight: currentVariant.weight,
          brand: product.brand,
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

  if (error && !product) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-lg font-semibold text-mdn-white">This product is currently not available.</p>
        <p className="mt-2 text-sm text-mdn-gray">We will add this soon.</p>
      </div>
    );
  }
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

  const galleryImages = product.images?.length ? product.images : [product.thumbnail];
  const teaser =
    product.shortDescription ||
    (product.description
      ? `${product.description.slice(0, 160)}${product.description.length > 160 ? "…" : ""}`
      : "");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid min-w-0 gap-10 lg:grid-cols-2">
        {/* Gallery — a plain, always-square image, capped so it never
            grows past a sane size on wide desktop columns. */}
        <div className="relative min-w-0 animate-fade-up lg:mx-auto lg:max-h-[561px] lg:max-w-[561px]">
          <div className="overflow-hidden rounded-xl border border-mdn-green/20 bg-mdn-charcoal2 shadow-green-glow">
            <Carousel
              slides={galleryImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`${product.name} photo ${i + 1}`}
                  onError={(e) => (e.target.style.display = "none")}
                  className="h-full w-full object-cover"
                />
              ))}
              autoPlay={false}
              showDots={galleryImages.length > 1}
              dotsPosition="overlay"
              showArrows
              pauseOnHover={false}
              slideClassName="aspect-square"
            />
          </div>
        </div>

        {/* Details */}
        <div className="min-w-0 animate-fade-up [animation-delay:100ms]">
          <p className="text-xs font-semibold uppercase tracking-widest text-mdn-green">{product.brand}</p>
          <h1 className="mt-1 break-words text-2xl font-bold text-mdn-white sm:text-3xl">{product.name}</h1>

          {product.ratingsCount > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <Stars rating={product.ratingsAverage} />
              <span className="text-sm text-mdn-gray">
                {product.ratingsAverage.toFixed(1)} ({product.ratingsCount} reviews)
              </span>
            </div>
          )}

          {teaser && <p className="mt-2 break-words text-sm leading-relaxed text-mdn-gray sm:text-base">{teaser}</p>}

          {/* Weight / pack picker */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-mdn-white">Choose Pack Size</label>
            <div className="mt-2 space-y-1.5 sm:space-y-2">
              {variantsForFlavor.map((v) => {
                const { price, discountPrice, effectivePrice, discountPct: pct } = getVariantPrice(v);
                const perServ = perServing(v, effectivePrice);
                const isSelected = selectedVariant === v._id;
                return (
                  <button
                    key={v._id}
                    type="button"
                    disabled={v.stock <= 0}
                    onClick={() => setSelectedVariant(v._id)}
                    className={`relative flex w-full items-center justify-between gap-3 rounded-xl border-2 px-2.5 pb-3.5 pt-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:gap-4 sm:px-3 sm:pb-4 sm:pt-3 ${
                      isSelected ? "border-mdn-green bg-mdn-green/5" : "border-white/10 hover:border-mdn-green/40"
                    }`}
                  >
                    {pct > 0 && (
                      <span className="absolute -top-2 right-3 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        Save {pct}%
                      </span>
                    )}
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 sm:h-5 sm:w-5 ${
                          isSelected ? "border-mdn-green" : "border-mdn-silver/40"
                        }`}
                      >
                        {isSelected && <span className="h-2 w-2 rounded-full bg-mdn-green sm:h-2.5 sm:w-2.5" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-mdn-white sm:text-base">{v.weight}</p>
                        {v.supplyLabel && <p className="truncate text-xs text-mdn-gray">{v.supplyLabel}</p>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-bold text-mdn-green sm:text-base">
                        ₹{effectivePrice}
                        {discountPrice && (
                          <span className="ml-1.5 text-xs font-medium text-mdn-gray line-through">₹{price}</span>
                        )}
                      </p>
                      {v.servings && (
                        <p className="text-[11px] text-mdn-gray">
                          ({v.servings} servings; ₹{perServ}/serving)
                        </p>
                      )}
                      {/* Per-card, not a shared line elsewhere on the page —
                          so it's unambiguous exactly which pack size it's
                          talking about. */}
                      {v.stock <= 0 ? (
                        <p className="text-[11px] font-semibold text-red-400">Out of stock</p>
                      ) : (
                        v.stock <= 10 && (
                          <p className="text-[11px] font-semibold text-orange-400">Only {v.stock} left</p>
                        )
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Flavor picker — shown whenever at least one variant has a
              flavor set. Uses `>= 1` (not `> 1`) because two variants can
              share the same flavor name yet still carry different swatch
              photos worth showing (e.g. two pack sizes of one flavor). */}
          {flavors.length >= 1 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-mdn-white">
                Choose Flavor{selectedFlavor ? ` — ${selectedFlavor}` : ""}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {flavors.map((f) => {
                  const isSelected = selectedFlavor === f.flavor;
                  return (
                    <button
                      key={f.flavor}
                      type="button"
                      onClick={() => handleSelectFlavor(f.flavor)}
                      className={`w-20 shrink-0 overflow-hidden rounded-xl border-2 text-center transition-all duration-200 ${
                        isSelected ? "border-mdn-green shadow-green-glow" : "border-white/10 hover:border-mdn-green/50"
                      }`}
                    >
                      {/* No padding here — the image runs edge-to-edge to
                          the card border, `overflow-hidden` on the button
                          itself clips it to the rounded corners. */}
                      <span className="relative block h-16 w-full bg-white">
                        {f.image && <img src={f.image} alt={f.flavor} className="h-full w-full object-fill" />}
                        {isSelected && (
                          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-mdn-green text-black">
                            <CheckRoundedIcon sx={{ fontSize: 11 }} />
                          </span>
                        )}
                      </span>
                      <span className="block bg-white px-1 py-1 line-clamp-1 text-xs font-bold text-black">
                        {f.flavor}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            ref={atcRef}
            onClick={handleAddToCart}
            disabled={outOfStock || adding}
            className="btn-primary mt-4 w-full py-2.5 text-base"
          >
            {outOfStock ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
          </button>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>
      </div>

      {/* Product info accordion — full width (matches the posters below),
          not confined to the details column, so it reads as its own
          section on large screens rather than a cramped half-width block. */}
      <div className="mt-10">
        <Accordion
          items={[
            { title: "Product Details", content: product.description },
            { title: "How to use?", content: product.directionsOfUse },
            { title: "Who is this for?", content: product.whoIsThisFor },
            { title: "Ingredients", content: product.ingredients },
          ]}
        />
      </div>

      {/* Two stacked promo posters — top is full width at half the
          bottom poster's height at every breakpoint (h-40/h-80,
          sm:h-52/h-[26rem], lg:h-64/h-[32rem]). */}
      {(product.posterTop || product.posterBottom) && (
        <div className="mt-16">
          <div className="h-40 overflow-hidden rounded-xl border border-white/10 bg-mdn-charcoal2 sm:h-52 lg:h-64">
            {product.posterTop ? (
              <img src={product.posterTop} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-mdn-gray">Poster space</div>
            )}
          </div>
          <div className="mt-4 h-80 overflow-hidden rounded-xl border border-white/10 bg-mdn-charcoal2 sm:h-[26rem] lg:h-[32rem]">
            {product.posterBottom ? (
              <img src={product.posterBottom} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-mdn-gray">Poster space</div>
            )}
          </div>
        </div>
      )}

      <ProductReviews
        reviews={product.reviews || []}
        ratingsAverage={product.ratingsAverage || 0}
        ratingsCount={product.ratingsCount || 0}
      />

      <StickyAddToCart
        atcRef={atcRef}
        product={product}
        currentVariant={currentVariant}
        outOfStock={outOfStock}
        adding={adding}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5 text-mdn-green">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < Math.round(rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6 5.8 20.7l1.6-6.9L2.1 9.1l7-.7L12 2z" />
        </svg>
      ))}
    </div>
  );
}
