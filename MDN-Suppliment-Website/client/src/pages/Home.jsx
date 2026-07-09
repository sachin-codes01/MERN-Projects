import { useEffect, useRef, useState } from "react";
import { api } from "../api/api";
import ProductSection from "../components/ProductSection";
import ProductCard from "../components/ProductCard";
import Hero from "../components/Hero";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import SearchInput from "../components/SearchInput";
import CustomerSupport from "../components/CustomerSupport";

export default function Home() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setProducts([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    api
      .getProducts({ search: debouncedQuery, limit: 40 })
      .then((d) => setProducts(d.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const isSearching = query.trim().length > 0;

  return (
    <div>
      <Hero />

      <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6">
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name, brand, product type..." />
      </div>

      {isSearching ? (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h2 className="text-xl font-bold text-mdn-white">Results for "{query.trim()}"</h2>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          {loading && <p className="mt-2 text-sm text-mdn-gray">Searching...</p>}
          {!loading && !error && products.length === 0 && (
            <p className="mt-2 text-sm text-mdn-gray">No products found for "{query.trim()}".</p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div id="best-sellers">
            <ProductSection section="best_seller" />
          </div>
          <ProductSection section="new_arrival" />
          <ProductSection section="fitness_combo" />
          <Testimonials />
          <CustomerSupport />
          <FAQ />
        </>
      )}
    </div>
  );
}