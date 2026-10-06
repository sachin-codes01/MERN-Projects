import { useEffect, useState } from "react";
import { api } from "../api/api";
import Reveal from "./motion/Reveal";
import ProductCard from "./ProductCard";
import ViewAllLink from "./ViewAllLink";

const SECTION_LABELS = {
  best_seller: "Best Sellers",
  new_arrival: "New Arrivals",
  fitness_combo: "Fitness Combos",
};

export default function ProductSection({ section }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProducts({ section, limit: 8 })
      .then((data) => setProducts(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [section]);

  if (loading) {
    return (
      <section className="mx-auto max-w-shell px-4 py-6 sm:px-6 sm:py-8 lg:px-[34px]">
        <div className="h-6 w-40 animate-pulse rounded bg-mdn-charcoal2" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-mdn-charcoal2" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-shell px-4 py-6 sm:px-6 sm:py-8 lg:px-[34px]">
      <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
        <h2 className="display-lg">{SECTION_LABELS[section]}</h2>
        <ViewAllLink to={`/products/section/${section}`} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((p, i) => (
          <Reveal key={p._id} from="up" delay={(i % 5) * 0.06} amount={0.15} className="h-full">
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}