import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import ProductCard from "./ProductCard";
import ItemCarousel from "./ItemCarousel";
import SectionHeading from "./SectionHeading";

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
export default function ProductCarousel({ section, eyebrow, titleMain, titleAccent, moreLink, sectionId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProducts({ section, limit: 16 })
      .then((d) => setProducts(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [section]);

  if (loading) {
    return (
      <section id={sectionId} className="mx-auto max-w-shell px-4 py-8 sm:px-6 sm:py-10 lg:px-[34px]">
        <div className="mx-auto h-6 w-48 animate-pulse rounded bg-mdn-charcoal2" />

        {/* The placeholder mirrors the LOADED layout: one non-wrapping row
            using the carousel's own widths, gap and vertical padding,
            clipped at the section edge like the carousel's viewport is.
            This was a `grid grid-cols-2 … lg:grid-cols-5` of four blocks,
            which stacked into TWO rows on a phone — so the section visibly
            collapsed from two rows to one the moment the products landed.
            Six blocks, because at lg the row fits five and a sliver. */}
        <div className="mt-8 overflow-hidden">
          <div className="flex gap-4 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] w-[47%] flex-shrink-0 animate-pulse rounded-xl bg-mdn-charcoal2 sm:w-[31%] lg:w-[18.4%]"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section id={sectionId} className="mx-auto max-w-shell px-4 py-8 sm:px-6 sm:py-10 lg:px-[34px]">
      <SectionHeading eyebrow={eyebrow} title={titleMain} accent={titleAccent} />

      <div className="mt-8">
        <ItemCarousel
          items={products}
          // No autoplay — these only move when the user drags/swipes or
          // clicks an arrow, per request.
          autoPlay={false}
          showDots={false}
          gapClassName="gap-4"
          itemClassName="w-[47%] sm:w-[31%] lg:w-[18.4%]"
          renderItem={(p) => <ProductCard product={p} />}
        />
      </div>

      {moreLink && (
        <div className="mt-8 text-center">
          <Link
            to={moreLink}
            className="group inline-flex items-center gap-2 rounded-full border border-mdn-green/40 px-6 py-2.5 text-sm font-semibold text-mdn-green transition-all duration-300 hover:border-mdn-green hover:bg-mdn-green hover:text-black hover:shadow-green-glow"
          >
            Show More
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      )}
    </section>
  );
}
