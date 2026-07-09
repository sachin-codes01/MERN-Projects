import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/api";
import ProductCard from "../components/ProductCard";

const SECTION_LABELS = {
  best_seller: "Best Sellers",
  new_arrival: "New Arrivals",
  fitness_combo: "Fitness Combos",
};

export default function SectionProducts() {
  const { section } = useParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    api
      .getProducts({ section, limit: 1000 })
      .then((d) => {
        const unique = [];
        const seen = new Set();
        d.data.forEach((p) => {
          const catId = p.category?._id || p.category;
          const catName = p.category?.name;
          if (catId && catName && !seen.has(catId)) {
            seen.add(catId);
            unique.push({ _id: catId, name: catName });
          }
        });
        setCategories(unique);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .getProducts({ section, category, sort, search, page, limit })
      .then((d) => {
        setProducts(d.data);
        setTotal(d.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [section, category, sort, search, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-mdn-green">Catalog</p>
      <h2 className="mt-1 text-2xl font-bold text-mdn-white sm:text-3xl">
        {SECTION_LABELS[section] || "Products"}
      </h2>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input-field flex-1 sm:max-w-xs"
        />
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="input-field w-auto"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="input-field w-auto"
        >
          <option value="">Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {loading && <p className="mt-4 text-sm text-mdn-gray">Loading...</p>}
      {!loading && products.length === 0 && (
        <p className="mt-4 text-sm text-mdn-gray">No products found.</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary !px-4 !py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-mdn-gray">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary !px-4 !py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}