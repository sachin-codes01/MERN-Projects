import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import ProductCard from "./ProductCard";

/**
 * Groups the full catalog by category and renders one row per category,
 * so /products reads as a divided catalog instead of one long grid.
 */
export default function ProductsByCategory() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProducts({ limit: 1000 })
      .then((d) => {
        const byCategory = new Map();
        d.data.forEach((p) => {
          const catId = p.category?._id || p.category || "uncategorized";
          const catName = p.category?.name || "More Products";
          if (!byCategory.has(catId)) byCategory.set(catId, { id: catId, name: catName, products: [] });
          byCategory.get(catId).products.push(p);
        });
        setGroups(Array.from(byCategory.values()).filter((g) => g.products.length > 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="h-6 w-40 animate-pulse rounded bg-mdn-charcoal2" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-mdn-charcoal2" />
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) return null;

  return (
    <div>
      {groups.map((g) => (
        <section key={g.id} className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-mdn-white sm:text-2xl">{g.name}</h2>
            <Link
              to={`/search?q=${encodeURIComponent(g.name)}`}
              className="text-sm font-semibold text-mdn-green transition-colors hover:text-mdn-green-light"
            >
              Show More →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {g.products.slice(0, 8).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
