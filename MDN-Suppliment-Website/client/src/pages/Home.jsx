import { useEffect, useRef, useState } from "react";
import { api } from "../api/api";
import ProductCard from "../components/ProductCard";
import Hero from "../components/Hero";
import CategoryMoves from "../components/CategoryMoves";
import StorySection from "../components/StorySection";
import Bestsellers from "../components/Bestsellers";
import TargetSection from "../components/TargetSection";
import ReviewsSection from "../components/ReviewsSection";
import TrustBadges from "../components/TrustBadges";
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

      {!isSearching && (
        <div className="mx-auto max-w-2xl px-4 pt-10 sm:hidden sm:px-6">
          {/* Mobile inline search — desktop search now lives in the navbar */}
          <SearchInput value={query} onChange={setQuery} placeholder="Search by name, brand, product type..." />
        </div>
      )}

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
          <CategoryMoves />
          <StorySection />
          <Bestsellers />
          <TargetSection />
          <ReviewsSection />
          <TrustBadges />
          <Testimonials />
          <CustomerSupport />
          <FAQ />
        </>
      )}
    </div>
  );
}
