import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import ProductCard from "../components/ProductCard";
import MDNLoader from "../components/MDNLoader";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    api
      .getProducts({ search: query, sort, page, limit })
      .then((d) => {
        setProducts(d.data);
        setTotal(d.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query, sort, page]);

  const totalPages = Math.ceil(total / limit);

  if (!query.trim()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-lg font-semibold text-mdn-white">No search query provided.</p>
        <button onClick={() => navigate("/")} className="btn-primary mt-4">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-mdn-green">Search</p>
      <h2 className="mt-1 break-words text-2xl font-bold text-mdn-white sm:text-3xl">
        Results for "{query}"
      </h2>

      {products.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
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
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {loading && <MDNLoader label="Searching" className="py-16" />}

      {!loading && products.length === 0 && (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-lg font-semibold text-mdn-white">No products found for "{query}".</p>
          <p className="mt-2 text-sm text-mdn-gray">Try a different search term or browse our categories.</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && !loading && (
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
