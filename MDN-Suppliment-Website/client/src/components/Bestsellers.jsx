import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import ProductCard from "./ProductCard";

const PER_SLIDE = 4; // desktop cards per slide; grid wraps down on smaller screens

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function Bestsellers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    api
      .getProducts({ section: "best_seller", limit: 16 })
      .then((d) => setProducts(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const slides = chunk(products, PER_SLIDE);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const goTo = (i) => {
    clearInterval(timerRef.current);
    setIndex(i);
  };

  if (loading) {
    return (
      <section id="best-sellers" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="h-6 w-48 animate-pulse rounded bg-mdn-charcoal2" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-mdn-charcoal2" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section id="best-sellers" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-mdn-green">Top rated</p>
          <h2 className="mt-1 text-3xl font-bold text-mdn-white sm:text-4xl">Our Bestsellers</h2>
        </div>
        <Link to="/products/section/best_seller" className="hidden text-sm font-semibold text-mdn-green hover:text-mdn-green-light sm:block">
          Show More →
        </Link>
      </div>

      {/* -mx-3 on the clipped wrapper cancels out the p-3 added to each
          slide below, so the row's visible edges line up exactly where
          they did before — the extra padding is purely "hover headroom"
          for the cards, not a layout shift. */}
      <div className="relative -mx-3 overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((group, si) => (
            // p-3 added — each slide is w-full, so this padding is
            // included in that slide's own width and doesn't throw off
            // the translateX(-100%) math between slides. It just gives
            // every card in the row room to scale outward on hover
            // without its edge hitting the parent's overflow-hidden
            // boundary (top, left, and right were all getting clipped
            // before, since edge/first-row cards had zero clearance).
            <div key={si} className="grid w-full flex-shrink-0 grid-cols-2 gap-4 p-3 sm:grid-cols-4">
              {group.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-mdn-green" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}