import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCartBadge } from "../context/CartBadgeContext";
import { useToast } from "../context/ToastContext";
import { guestCart } from "../utils/guestCart";
import Carousel from "../components/Carousel";
import Accordion from "../components/Accordion";
import ProductReviews from "../components/ProductReviews";
import RelatedProducts from "../components/RelatedProducts";
import StickyAddToCart from "../components/StickyAddToCart";
import ProductBenefits from "../components/ProductBenefits";
import ProductFacts, { ProductTagRow } from "../components/ProductFacts";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import BiotechOutlinedIcon from "@mui/icons-material/BiotechOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";
import { getSizePrice } from "../utils/pricing";
import { getDisplayRating, reviewCountLabel } from "../utils/rating";
import { useMediaQuery } from "../hooks/useMediaQuery";

// Site-wide assurances shown under the buy box, straight from the
// reference. Deliberately NOT per-product: these are the same promise on
// every item, which is what makes them a trust row rather than a claim.
const TRUST_ITEMS = [
  { title: "100% Authentic", sub: "Products", Icon: VerifiedOutlinedIcon },
  { title: "Lab Tested", sub: "& Certified", Icon: BiotechOutlinedIcon },
  { title: "No Banned", sub: "Substances", Icon: BlockOutlinedIcon },
  { title: "GMP Certified", sub: "Facilities", Icon: FactoryOutlinedIcon },
];

const perServing = (size, effectivePrice) => (size.servings ? Math.round(effectivePrice / size.servings) : null);

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [selectedFlavorId, setSelectedFlavorId] = useState(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const { token, user } = useAuth();
  const { markNewItem } = useCartBadge();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const atcRef = useRef(null);
  // Drives the gallery from the thumbnail strip, and tracks which slide
  // is showing so the matching thumbnail can be highlighted — including
  // when autoplay or a swipe moved it rather than a click.
  const galleryRef = useRef(null);
  const [activeImage, setActiveImage] = useState(0);
  // Desktop keeps the accordion in its original slot, directly above the
  // nutrition facts. On small screens it moves below the product's own
  // claims instead. BOTH positions are full-width blocks outside the
  // two-column grid — the accordion is deliberately never placed inside
  // the gallery column, because that made the column as tall as the
  // details column and left the `lg:sticky` gallery with zero travel.
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    api
      .getProductBySlug(slug)
      .then((data) => {
        setProduct(data.data);
        setSelectedSizeId(data.data.sizes?.[0]?._id || null);
        setSelectedFlavorId(data.data.flavors?.[0]?._id || null);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  const sizes = product?.sizes || [];
  const flavors = product?.flavors || [];
  const hasSizes = sizes.length > 0;

  const currentSize = sizes.find((s) => s._id === selectedSizeId);
  const currentFlavor = selectedFlavorId ? flavors.find((f) => f._id === selectedFlavorId) : null;
  // Products can be saved without any size (e.g. mid-setup in admin) —
  // treat "no purchasable size" the same as out-of-stock so Add to Cart
  // stays disabled instead of throwing when it reads currentSize fields.
  const outOfStock = !currentSize || currentSize.stock <= 0;

  const handleAddToCart = async () => {
    if (!currentSize) return;
    setError("");
    try {
      setAdding(true);
      const { effectivePrice } = getSizePrice(currentSize, currentFlavor?.priceAdjustment || 0);
      if (token) {
        await api.addToCart(token, {
          productId: product._id,
          sizeId: selectedSizeId,
          flavorId: selectedFlavorId,
          quantity: 1,
        });
      } else {
        guestCart.addItem({
          productId: product._id,
          sizeId: selectedSizeId,
          flavorId: selectedFlavorId,
          quantity: 1,
          name: product.name,
          image: product.thumbnail || currentFlavor?.image,
          price: effectivePrice,
          slug: product.slug,
          stock: currentSize.stock,
          flavor: currentFlavor?.name || null,
          weight: currentSize.weight,
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

  const handleSubmitReview = async ({ rating, comment }) => {
    try {
      await api.addProductReview(token, product._id, { rating, comment });
      const data = await api.getProductBySlug(slug);
      setProduct(data.data);
      success("Review submitted — thanks for sharing!");
      return true;
    } catch (err) {
      toastError(err.message);
      return false;
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
      <div className="mx-auto max-w-shell px-4 py-10 sm:px-6 lg:px-[34px]">
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

  const accordionBlock = (
    <div className="mt-6">
      <Accordion
        items={[
          { title: "Product Details", content: product.description },
          { title: "How to use?", content: product.directionsOfUse },
          { title: "Who is this for?", content: product.whoIsThisFor },
          { title: "Ingredients", content: product.ingredients },
        ]}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-shell px-4 py-8 sm:px-6 lg:px-[34px]">
      <div className="grid min-w-0 gap-10 lg:grid-cols-2">
        {/* Gallery — a plain, always-square image, capped so it never
            grows past a sane size on wide desktop columns.

            Pinned while the details column scrolls past it (desktop only —
            the two columns are stacked below `lg`, where sticking would
            just cover the content). Three things make it work:

            • `self-start` — grid items stretch to the row height by
              default, and a stretched item fills its track, so it has no
              room to move within it and can never stick.
            • `top-[120px]` — clears the 112px sticky navbar, plus 8px so
              the image doesn't sit flush against it.
            • no `max-h` — the old `lg:max-h-[561px]` capped the box below
              its real content now that the thumbnail strip sits inside it,
              which would make sticky release at the wrong scroll point.
              `max-w-[561px]` still bounds the size, and the carousel is
              square, so the height is capped by width anyway.

            Release happens on its own: the grid's bottom is the bottom of
            the taller (details) column, so the gallery unpins exactly when
            Add to Cart reaches its lower edge, and re-pins on the way back
            up. No scroll listener involved. */}
        <div className="relative min-w-0 animate-fade-up lg:sticky lg:top-[120px] lg:mx-auto lg:max-w-[561px] lg:self-start">
          <div className="overflow-hidden rounded-xl border border-mdn-green/20 bg-mdn-charcoal2 shadow-green-glow">
            <Carousel
              ref={galleryRef}
              slides={galleryImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`${product.name} photo ${i + 1}`}
                  onError={(e) => (e.target.style.display = "none")}
                  // object-contain, not object-cover: product photos come
                  // in whatever ratio they were shot at, and cover crops
                  // whichever edge doesn't fit — cutting off lids, labels
                  // and text. Contain fits the whole image inside the
                  // square instead, so nothing is ever cut.
                  className="h-full w-full object-contain"
                />
              ))}
              // Auto-advances on its own, and `pauseOnHover` (the
              // Carousel default) holds it while the pointer is over the
              // gallery so it can't slide out from under someone
              // inspecting a photo.
              autoPlay
              interval={3500}
              showDots={galleryImages.length > 1}
              dotsPosition="overlay"
              showArrows
              onIndexChange={setActiveImage}
              slideClassName="aspect-square"
            />
          </div>

          {/* Thumbnail strip — 5 per row, wrapping to further rows when a
              product has more shots. Clicking one drives the big carousel
              above via its imperative `goTo`. */}
          {galleryImages.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {galleryImages.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => galleryRef.current?.goTo(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === activeImage}
                  className={`overflow-hidden rounded-lg border-2 bg-mdn-charcoal2 transition-all duration-200 ${
                    i === activeImage
                      ? "border-mdn-green shadow-green-glow"
                      : "border-white/10 hover:border-mdn-green/50"
                  }`}
                >
                  <img
                    src={src}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    onError={(e) => (e.target.style.display = "none")}
                    className="aspect-square h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Details */}
        <div className="min-w-0 animate-fade-up [animation-delay:100ms]">
          {/* Brand in orange above the title, per the reference. */}
          <p className="text-xs font-semibold uppercase tracking-widest text-mdn-orange">{product.brand}</p>
          {/* font-body overrides the Didot default that h1-h4 inherit —
              the product name is set in normal sans here. */}
          <h1 className="mt-1 break-words font-body text-2xl font-bold text-mdn-white sm:text-3xl">
            {product.name}
          </h1>

          {/* Rating comes from utils/rating.js (admin override, else the
              real review average). The COUNT beside it is always the real
              number of reviews — it reads "0 Reviews" on a product nobody
              has reviewed yet, and rises on its own as reviews come in,
              because the review endpoint recomputes ratingsCount on every
              submission. */}
          {(() => {
            const { value, stars, count, hasRating } = getDisplayRating(product);
            if (!hasRating && count === 0) return null;
            return (
              <div className="mt-2 flex items-center gap-2">
                <Stars stars={stars} />
                <span className="text-sm text-mdn-gray">
                  {hasRating && `${value.toFixed(1)} `}({reviewCountLabel(count)})
                </span>
              </div>
            );
          })()}

          {teaser && <p className="mt-2 break-words text-sm leading-relaxed text-mdn-gray sm:text-base">{teaser}</p>}

          {/* Dietary/goal suitability — sits above price because "is this
              vegan / gluten-free" is a filter a buyer applies before they
              look at anything else. Data already existed on the product;
              it just wasn't rendered anywhere. */}
          <ProductTagRow product={product} />

          {/* Nutrition highlights — per-product stat cards set in the
              admin panel (Product.nutritionHighlights). Values carry their
              own units, so they print exactly as entered. auto-fit rather
              than a fixed column count because the number of stats varies
              per product — 5 for a whey, fewer for an accessory — and a
              fixed grid would leave gaps or squeeze them. */}
          {product.nutritionHighlights?.length > 0 && (
            <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(76px,1fr))] gap-2">
              {product.nutritionHighlights.map((h) => (
                <div
                  key={h.label}
                  className="rounded-lg border border-white/10 bg-mdn-charcoal2 px-2 py-2.5 text-center"
                >
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-mdn-gray">
                    {h.label}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-sm font-bold text-mdn-green sm:text-base">
                    {h.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Size picker — independent of flavor: every size is always
              shown here. Its price already reflects whichever flavor is
              currently selected below (base size price +/- that flavor's
              adjustment), so switching flavor updates these prices live. */}
          {hasSizes && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-mdn-white">Choose Size</label>
              <div className="mt-2 space-y-1.5 sm:space-y-2">
                {sizes.map((s) => {
                  const { price, discountPrice, effectivePrice, discountPct: pct } = getSizePrice(
                    s,
                    currentFlavor?.priceAdjustment || 0
                  );
                  const perServ = perServing(s, effectivePrice);
                  const isSelected = selectedSizeId === s._id;
                  return (
                    <button
                      key={s._id}
                      type="button"
                      disabled={s.stock <= 0}
                      onClick={() => setSelectedSizeId(s._id)}
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
                          <p className="truncate text-sm font-semibold text-mdn-white sm:text-base">{s.weight}</p>
                          {s.supplyLabel && <p className="truncate text-xs text-mdn-gray">{s.supplyLabel}</p>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-sm font-bold text-mdn-green sm:text-base">
                          ₹{effectivePrice}
                          {discountPrice && (
                            <span className="ml-1.5 text-xs font-medium text-mdn-gray line-through">₹{price}</span>
                          )}
                        </p>
                        {s.servings && (
                          <p className="text-[11px] text-mdn-gray">
                            ({s.servings} servings; ₹{perServ}/serving)
                          </p>
                        )}
                        {/* Per-card, not a shared line elsewhere on the page —
                            so it's unambiguous exactly which size it's
                            talking about. */}
                        {s.stock <= 0 ? (
                          <p className="text-[11px] font-semibold text-red-400">Out of stock</p>
                        ) : (
                          s.stock <= 10 && (
                            <p className="text-[11px] font-semibold text-orange-400">Only {s.stock} left</p>
                          )
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Flavor picker — fully independent of size: choosing a flavor
              never changes which sizes are available, it only shifts the
              price of whichever size is currently selected. */}
          {flavors.length >= 1 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-mdn-white">
                Choose Flavor{currentFlavor ? ` — ${currentFlavor.name}` : ""}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {flavors.map((f) => {
                  const isSelected = selectedFlavorId === f._id;
                  return (
                    <button
                      key={f._id}
                      type="button"
                      onClick={() => setSelectedFlavorId(f._id)}
                      className={`w-20 shrink-0 overflow-hidden rounded-xl border-2 text-center transition-all duration-200 ${
                        isSelected ? "border-mdn-green shadow-green-glow" : "border-white/10 hover:border-mdn-green/50"
                      }`}
                    >
                      {/* No padding here — the image runs edge-to-edge to
                          the card border, `overflow-hidden` on the button
                          itself clips it to the rounded corners. */}
                      <span className="relative block h-16 w-full bg-white">
                        {f.image && <img src={f.image} alt={f.name} className="h-full w-full object-fill" />}
                        {isSelected && (
                          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-mdn-orange text-white">
                            <CheckRoundedIcon sx={{ fontSize: 11 }} />
                          </span>
                        )}
                      </span>
                      <span className="block bg-white px-1 py-1 line-clamp-1 text-xs font-bold text-black">
                        {f.name}
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
            className="btn-primary mt-6 w-full !py-3"
          >
            {!hasSizes
              ? "Currently Unavailable"
              : outOfStock
              ? "Out of Stock"
              : adding
              ? "Adding..."
              : "Add to Cart"}
          </button>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>
      </div>

      {/* Trust row — the four assurances from the reference, directly
          under the buy box. `ProductBenefits` below carries the PRODUCT's
          own claims (per-product, set in admin); these four are the
          site-wide guarantees, so the two do not repeat each other. */}
      <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-6 rounded-2xl border border-mdn-border bg-mdn-sand px-4 py-6 sm:px-8 lg:grid-cols-4">
        {TRUST_ITEMS.map(({ title, sub, Icon }) => (
          <li key={title} className="flex items-center justify-center gap-3 text-left">
            <Icon aria-hidden="true" className="shrink-0 text-mdn-green" sx={{ fontSize: 26 }} />
            <span className="min-w-0">
              <span className="block text-[13px] font-bold leading-tight text-mdn-ink">{title}</span>
              <span className="block text-[11px] leading-tight text-mdn-ink-body">{sub}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        {isDesktop && accordionBlock}

        {/* Nutrition table, shelf-life dates and safety warnings. All of
            it was already stored on the product and captured in the admin
            panel — none of it reached this page before. */}
        <ProductFacts product={product} />

        {/* Per-product claim strip. Renders nothing until benefits are set
            in the admin panel. */}
        <ProductBenefits benefits={product.benefits} />

        {/* Small screens only — see the note on `isDesktop` above. */}
        {!isDesktop && accordionBlock}
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

      {/* Sits directly above the reviews, per request. */}
      <RelatedProducts product={product} />

      <ProductReviews
        reviews={product.reviews || []}
        ratingsAverage={product.ratingsAverage || 0}
        ratingsCount={product.ratingsCount || 0}
        currentUserId={user?.id || null}
        canReview={!!token}
        onSubmitReview={handleSubmitReview}
      />

      <StickyAddToCart
        atcRef={atcRef}
        product={product}
        currentSize={currentSize}
        currentFlavor={currentFlavor}
        outOfStock={outOfStock}
        adding={adding}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

function Stars({ stars }) {
  const filled = Math.max(0, Math.min(5, stars));
  return (
    <div className="flex gap-0.5 text-mdn-star">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6 5.8 20.7l1.6-6.9L2.1 9.1l7-.7L12 2z" />
        </svg>
      ))}
    </div>
  );
}
