import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import ProductCard from "./ProductCard";

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
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="h-6 w-40 animate-pulse rounded bg-mdn-charcoal2" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-mdn-charcoal2" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-mdn-white sm:text-2xl">{SECTION_LABELS[section]}</h2>
        <Link
          to={`/products/section/${section}`}
          className="text-sm font-semibold text-mdn-green transition-colors hover:text-mdn-green-light"
        >
          Show More →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}