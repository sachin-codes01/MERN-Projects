import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import ProductCard from "./ProductCard";
import ItemCarousel from "./ItemCarousel";
import SectionHeading from "./SectionHeading";
import Reveal from "./motion/Reveal";

/**
 * Shared carousel used for both "Bestsellers" (section="best_seller")
 * and "Bundles & Offers" (section="fitness_combo").
 *
 * Rebuilt on ItemCarousel instead of the old grid-of-4-per-slide
 * Carousel — a CSS grid with grid-cols-2 on mobile was wrapping 4 cards
 * into two rows. ItemCarousel is a single flex row that never wraps, so
 * cards are always exactly one row, at every screen size, and just show
 * fewer of them at once on narrow screens.
 */
const ProductCarousel = ({
  section,
  eyebrow,
  subtitle,
  // Section padding me per-instance tweak (e.g. Bestsellers ka top gap kam)
  className = "",
  titleMain,
  titleAccent,
  moreLink,
  sectionId,
  // Folio numeral for the masthead. Passed only by the home-page
  // instances, which form a numbered read-down sequence — "Related
  // Products" on a PDP is a lone section, so a numeral there would be
  // counting something the reader can't see.
  index,
  // Optional tabs (reference jaisa "Best Sellers / Proteins / ..."): har tab
  // { key, label, match(product), link }. Diye ho to poora catalogue ek baar
  // fetch hota hai aur tab badalne pe client-side filter — turant switch.
  tabs,
  // Phone pe slider ki jagah 2-column grid me itni rows (e.g. 2 → 4 cards)
  mobileRows,
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState(tabs?.[0]?.key);

  useEffect(() => {
    api
      .getProducts(tabs ? { limit: 100 } : { section, limit: 16 })
      .then((d) => setProducts(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [section, tabs]);

  // Sirf wahi tabs jinme kam se kam ek product hai
  const visibleTabs = tabs ? tabs.filter((t) => products.some(t.match)) : [];
  const activeTab = visibleTabs.find((t) => t.key === activeKey) || visibleTabs[0];
  const shown = tabs ? (activeTab ? products.filter(activeTab.match).slice(0, 16) : []) : products;
  const viewAllLink = tabs ? activeTab?.link : moreLink;

  if (loading) {
    return (
      <section id={sectionId} className={`section ${className}`}>
        <div className="mx-auto h-6 w-48 animate-pulse rounded bg-mdn-charcoal2" />

        {/* The placeholder mirrors the LOADED layout: one non-wrapping row
            using the carousel's own widths, gap and vertical padding,
            clipped at the section edge like the carousel's viewport is.
            This was a `grid grid-cols-2 … lg:grid-cols-5` of four blocks,
            which stacked into TWO rows on a phone — so the section visibly
            collapsed from two rows to one the moment the products landed.
            Six blocks, because at lg the row fits five and a sliver. */}
        <div className="mt-6 overflow-hidden">
          <div className="flex gap-3 py-4 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] w-[calc(50%-6px)] flex-shrink-0 animate-pulse rounded-xl bg-mdn-charcoal2 sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] xl:w-[calc(20%-13px)]"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (shown.length === 0) return null;

  return (
    <section id={sectionId} className={`section ${className}`}>
      <SectionHeading index={index} eyebrow={eyebrow} title={titleMain} accent={titleAccent} subtitle={subtitle} />

      {visibleTabs.length > 1 && (
        // Tab strip — neeche patli orange line, active tab orange border wala
        // "folder" tab jo line ke upar baithta hai. Phone pe side me scroll.
        <div className="no-scrollbar -mx-4 mt-5 overflow-x-auto px-4 sm:mx-0 sm:mt-6 sm:px-0">
          <div role="tablist" aria-label="Product categories" className="mx-auto flex w-max min-w-full justify-center border-b-2 border-mdn-orange-solid/70">
            {visibleTabs.map((t) => {
              const active = t.key === activeTab?.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveKey(t.key)}
                  className={`label -mb-[2px] whitespace-nowrap rounded-t-2xl border-2 px-4 py-2.5 text-[11.5px] !tracking-[0.14em] transition-colors duration-200 sm:px-7 sm:py-3 sm:text-[13px] ${
                    active
                      ? "border-mdn-orange-solid/70 border-b-mdn-black bg-mdn-black text-mdn-ink"
                      : "border-transparent text-mdn-ink-muted hover:text-mdn-ink"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ONE reveal around the carousel rather than one per ProductCard.
          Two reasons, both of which make per-card reveals actively wrong
          here:

          1. Correctness. The carousel renders up to 16 products in a
             single non-wrapping flex row inside an `overflow-hidden`
             viewport. Only the first ~5 are ever on screen; the rest
             never intersect, so `whileInView` with `once: true` would
             leave them at opacity 0 — and they would STILL be invisible
             after the user dragged to them, because the observer fires on
             viewport intersection, not on carousel position.
          2. Restraint. Sixteen individually-staggered cards is a lot of
             movement for a merchandising row the user is going to scan,
             not read. The row arriving as one object is calmer and
             matches how the Assured badge row already behaves. */}
      {mobileRows && (
        // Phone: 2 column grid, `mobileRows` rows — baaki "View all" se
        <div className="mt-4 grid grid-cols-2 gap-3 sm:hidden">
          {shown.slice(0, mobileRows * 2).map((p, i) => (
            <Reveal key={p._id} from="up" delay={(i % 2) * 0.06} amount={0.15} className="h-full">
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}

      <Reveal from="up" amount={0.15} className={`mt-4 sm:mt-6 ${mobileRows ? "hidden sm:block" : ""}`}>
        <ItemCarousel
          // Tab badalne pe carousel shuru se (key se remount)
          key={activeTab?.key || "all"}
          items={shown}
          // No autoplay — these only move when the user drags/swipes or
          // clicks an arrow, per request.
          autoPlay={false}
          showDots={false}
          showProgress
          gapClassName="gap-3 sm:gap-4"
          itemClassName="w-[calc(50%-6px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] xl:w-[calc(20%-13px)]"
          renderItem={(p) => <ProductCard product={p} />}
        />
      </Reveal>

      {viewAllLink && (
        <Reveal from="up" delay={0.1} className="mt-5 text-center sm:mt-6">
          <Link
            to={viewAllLink}
            className="press group inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-mdn-border-strong px-6 py-2.5 font-heading text-sm font-semibold text-mdn-ink transition-colors duration-200 hover:border-mdn-green hover:bg-mdn-green hover:text-mdn-on-primary"
          >
            View all
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </Reveal>
      )}
    </section>
  );
};

export default ProductCarousel;
