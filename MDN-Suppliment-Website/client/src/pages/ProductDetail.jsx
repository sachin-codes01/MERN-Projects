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

const isUnflavoured = (name = "") => /^un-?flavou?red$/i.test(name.replace(/\s+/g, ""));
const unflavouredFirst = (list) => [
  ...list.filter((f) => isUnflavoured(f.name)),
  ...list.filter((f) => !isUnflavoured(f.name)),
];

const perServing = (size, effectivePrice) => (size.servings ? Math.round(effectivePrice / size.servings) : null);

const ProductDetail = () => {
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
        setSelectedFlavorId(unflavouredFirst(data.data.flavors || [])[0]?._id || null);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  const sizes = product?.sizes || [];
  // Unflavoured, when the product has it, always leads the picker (and is
  // the default pick) — even on products saved before that rule existed.
  const flavors = unflavouredFirst(product?.flavors || []);
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
          image: currentFlavor?.images?.[0] || product.thumbnail || currentFlavor?.image,
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
        <p className="font-heading text-lg font-semibold text-mdn-ink">This product is currently not available.</p>
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

  // The selected flavour can override photos and copy (set per flavour in
  // the admin panel). Each field falls back to the product's own value
  // when the flavour leaves it empty, so flavours only carry what differs.
  const view = {
    images: currentFlavor?.images?.length ? currentFlavor.images : product.images,
    shortDescription: currentFlavor?.shortDescription || product.shortDescription,
    description: currentFlavor?.description || product.description,
    ingredients: currentFlavor?.ingredients || product.ingredients,
    nutritionHighlights: currentFlavor?.nutritionHighlights?.length
      ? currentFlavor.nutritionHighlights
      : product.nutritionHighlights,
  };

  const selectedPrice = currentSize ? getSizePrice(currentSize, currentFlavor?.priceAdjustment || 0) : null;

  const galleryImages = view.images?.length ? view.images : [product.thumbnail];
  const teaser =
    view.shortDescription ||
    (view.description
      ? `${view.description.slice(0, 160)}${view.description.length > 160 ? "…" : ""}`
      : "");

  const accordionBlock = (
    <div className="mt-6">
      <Accordion
        items={[
          { title: "Product Details", content: view.description },
          { title: "How to use?", content: product.directionsOfUse },
          { title: "Who is this for?", content: product.whoIsThisFor },
          { title: "Ingredients", content: view.ingredients },
        ]}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-shell px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-[34px]">
      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-12">
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
        <div className="relative min-w-0 animate-fade-up lg:sticky lg:top-[calc(var(--nav-h,79px)+16px)] lg:self-start">
          {/* Koi box/frame nahi. Desktop pe badi image ka size/jagah fixed (column ke
              right me, 88px left offset), thumbnails uske theek neeche. */}
          {/* Phone/tablet pe image screen ki poori width aur navbar se chipki (page padding ke bahar) */}
          <div className="-mx-4 -mt-4 overflow-hidden sm:-mx-6 sm:-mt-6 lg:mx-0 lg:ml-[88px] lg:mt-0">
            <Carousel
              // Remount on flavour change so the gallery restarts at the
              // new flavour's first photo instead of a stale slide index.
              key={selectedFlavorId || "default"}
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
                  // object-fill: poori photo frame me stretch hoti hai — kuch crop nahi
                  className="h-full w-full object-fill"
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
              slideClassName="aspect-[4/5] sm:aspect-square lg:aspect-auto lg:h-[min(850px,calc(100svh-var(--nav-h,79px)-30px))]"
            />
          </div>

          {/* Thumbnails — har screen pe badi image ke neeche ek row.
              Click karne pe bada carousel us photo pe jata hai (`goTo`). */}
          {galleryImages.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto lg:ml-[88px]">
              {galleryImages.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => galleryRef.current?.goTo(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === activeImage}
                  className={`w-[18%] max-w-[84px] flex-shrink-0 overflow-hidden rounded-lg border-2 bg-mdn-sand transition-colors duration-200 ${
                    i === activeImage ? "border-mdn-green" : "border-mdn-border hover:border-mdn-green/50"
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

        {/* Details — reference PDP order: rating, title, stats, price, flavour, size, CTA */}
        <div className="min-w-0 animate-fade-up [animation-delay:100ms]">
          <div className="flex items-center justify-between gap-3">
            {(() => {
              const { value, stars, count, hasRating } = getDisplayRating(product);
              if (!hasRating && count === 0) return <span />;
              return (
                <div className="flex items-center gap-2">
                  <Stars stars={stars} />
                  <span className="text-xs text-mdn-ink-muted sm:text-sm">
                    {hasRating && `${value.toFixed(1)} `}({reviewCountLabel(count)})
                  </span>
                </div>
              );
            })()}
            {product.brand && (
              <p className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-mdn-orange-ink sm:text-[11px]">
                {product.brand}
              </p>
            )}
          </div>

          <h1 className="mt-2 break-words font-heading text-[24px] font-bold leading-tight tracking-tight text-mdn-ink sm:text-[32px] lg:text-[36px]">
            {product.name}
          </h1>

          {teaser && <p className="mt-2 break-words text-[15px] leading-relaxed text-mdn-ink-body sm:text-base">{teaser}</p>}

          <ProductTagRow product={product} />

          {/* Nutrition stats — reference jaisa ek hi bordered strip, beech me dividers */}
          {view.nutritionHighlights?.length > 0 && (
            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(64px,1fr))] divide-x divide-mdn-border overflow-hidden rounded-xl border border-mdn-border bg-mdn-charcoal">
              {view.nutritionHighlights.map((h) => (
                <div key={h.label} className="px-1.5 py-2.5 text-center">
                  <p className="truncate text-[11px] font-medium text-mdn-ink-muted sm:text-xs">{h.label}</p>
                  <p className="mt-0.5 truncate font-heading text-[15px] font-bold text-mdn-green-title sm:text-[17px]">
                    {h.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Price block — selected size + flavour ka final price */}
          {selectedPrice && (
            <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-mdn-border pb-5">
              <span className="font-heading text-[30px] font-bold leading-none tracking-tight text-mdn-ink sm:text-[36px]">
                ₹{selectedPrice.effectivePrice}
              </span>
              {selectedPrice.discountPrice && (
                <span className="text-[15px] text-mdn-ink-muted">
                  MRP <span className="line-through">₹{selectedPrice.price}</span>
                </span>
              )}
              {selectedPrice.discountPct > 0 && <span className="badge-save">Save {selectedPrice.discountPct}%</span>}
              <span className="w-full text-xs text-mdn-ink-muted">Inclusive of all taxes</span>
            </div>
          )}

          {/* Flavour picker — size se independent, sirf price shift karta hai */}
          {flavors.length >= 1 && (
            <div className="mt-5">
              <p className="font-heading text-[15px] font-semibold text-mdn-ink sm:text-base">
                Choose Flavour
                {currentFlavor && <span className="ml-1.5 font-normal text-mdn-ink-muted">{currentFlavor.name}</span>}
              </p>
              <div className="mt-2.5 grid grid-cols-4 gap-2 sm:grid-cols-5">
                {flavors.map((f) => {
                  const isSelected = selectedFlavorId === f._id;
                  return (
                    <button
                      key={f._id}
                      type="button"
                      onClick={() => {
                        setSelectedFlavorId(f._id);
                        setActiveImage(0);
                      }}
                      aria-pressed={isSelected}
                      className={`press overflow-hidden rounded-lg border-2 bg-mdn-charcoal text-center transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow ${
                        isSelected ? "border-mdn-green" : "border-mdn-border hover:border-mdn-green/50"
                      }`}
                    >
                      <span className="relative block aspect-square w-full bg-white">
                        {f.image && <img src={f.image} alt={f.name} className="h-full w-full object-fill" />}
                        {isSelected && (
                          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-mdn-green text-mdn-on-primary">
                            <CheckRoundedIcon sx={{ fontSize: 11 }} />
                          </span>
                        )}
                      </span>
                      <span className="block px-1 py-1.5 line-clamp-1 text-[12px] font-medium leading-tight text-mdn-ink sm:text-[13px]">
                        {f.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size picker — har size ka price selected flavour ke hisaab se */}
          {hasSizes && (
            <div className="mt-5">
              <p className="font-heading text-[15px] font-semibold text-mdn-ink sm:text-base">Choose Size</p>
              <div className="mt-2.5 space-y-2.5">
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
                      aria-pressed={isSelected}
                      className={`press relative flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-[border-color,background-color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 ${
                        isSelected
                          ? "border-mdn-green bg-mdn-green-soft/60 ring-1 ring-mdn-green"
                          : "border-mdn-border bg-mdn-charcoal hover:border-mdn-green/40"
                      }`}
                    >
                      {pct > 0 && <span className="badge-save absolute -top-2 right-3">Save {pct}%</span>}
                      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        <span
                          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                            isSelected ? "border-mdn-green" : "border-mdn-border-strong"
                          }`}
                        >
                          {isSelected && <span className="h-2 w-2 rounded-full bg-mdn-green" />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-heading text-[15px] font-semibold text-mdn-ink sm:text-base">{s.weight}</p>
                          {s.supplyLabel && <p className="truncate text-xs text-mdn-ink-muted">{s.supplyLabel}</p>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-heading text-[15px] font-bold tabular-nums text-mdn-ink sm:text-base">
                          ₹{effectivePrice}
                          {discountPrice && (
                            <span className="ml-1.5 text-xs font-normal text-mdn-ink-muted line-through">₹{price}</span>
                          )}
                        </p>
                        {s.servings && (
                          <p className="text-xs text-mdn-ink-muted">
                            {s.servings} servings · ₹{perServ}/serving
                          </p>
                        )}
                        {s.stock <= 0 ? (
                          <p className="text-[11px] font-semibold text-mdn-danger">Out of stock</p>
                        ) : (
                          s.stock <= 10 && (
                            <p className="text-[11px] font-semibold text-mdn-stock-low">Only {s.stock} left</p>
                          )
                        )}
                      </div>
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
            className="btn-primary mt-6 min-h-[54px] w-full !py-3.5 text-base"
          >
            {!hasSizes
              ? "Currently Unavailable"
              : outOfStock
              ? "Out of Stock"
              : adding
              ? "Adding..."
              : `Add to Cart | ₹${selectedPrice.effectivePrice}`}
          </button>

          {error && <p className="mt-3 text-sm text-mdn-danger">{error}</p>}
        </div>
      </div>

      {/* Trust row — the four assurances from the reference, directly
          under the buy box. `ProductBenefits` below carries the PRODUCT's
          own claims (per-product, set in admin); these four are the
          site-wide guarantees, so the two do not repeat each other. */}
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border border-mdn-border bg-mdn-sand px-4 py-5 sm:mt-10 sm:px-8 sm:py-6 lg:grid-cols-4">
        {TRUST_ITEMS.map(({ title, sub, Icon }) => (
          <li key={title} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mdn-charcoal text-mdn-green shadow-xs">
              <Icon aria-hidden="true" sx={{ fontSize: 21 }} />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-sm font-semibold leading-tight text-mdn-ink sm:text-[15px]">{title}</span>
              <span className="block text-xs leading-tight text-mdn-ink-body">{sub}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8 sm:mt-10">
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
          sm:h-52/h-[26rem], lg:h-64/h-[32rem]). Image box me stretch hoti
          hai (object-fill) — poora poster dikhta hai, crop nahi. */}
      {(product.posterTop || product.posterBottom) && (
        <div className="mt-10 sm:mt-14">
          <div className="h-40 overflow-hidden rounded-xl border border-mdn-border bg-mdn-charcoal2 sm:h-52 lg:h-64">
            {product.posterTop ? (
              <img src={product.posterTop} alt="" className="h-full w-full object-fill" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-mdn-gray">Poster space</div>
            )}
          </div>
          <div className="mt-4 h-80 overflow-hidden rounded-xl border border-mdn-border bg-mdn-charcoal2 sm:h-[26rem] lg:h-[32rem]">
            {product.posterBottom ? (
              <img src={product.posterBottom} alt="" className="h-full w-full object-fill" />
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
};

const Stars = ({ stars }) => {
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
};

export default ProductDetail;
