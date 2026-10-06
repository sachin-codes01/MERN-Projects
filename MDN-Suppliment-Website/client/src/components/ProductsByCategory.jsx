import { useEffect, useState } from "react";
import { api } from "../api/api";
import Reveal from "./motion/Reveal";
import ProductCard from "./ProductCard";
import ViewAllLink from "./ViewAllLink";

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
      <div className="mx-auto max-w-shell px-4 py-8 sm:px-6 lg:px-[34px]">
        <div className="h-6 w-40 animate-pulse rounded bg-mdn-charcoal2" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
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
        <section key={g.id} className="mx-auto max-w-shell px-4 py-6 sm:px-6 sm:py-8 lg:px-[34px]">
          <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
            <h2 className="display-lg">{g.name}</h2>
            <ViewAllLink to={`/search?q=${encodeURIComponent(g.name)}`} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {g.products.slice(0, 8).map((p, i) => (
              <Reveal key={p._id} from="up" delay={(i % 5) * 0.06} amount={0.15} className="h-full">
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
