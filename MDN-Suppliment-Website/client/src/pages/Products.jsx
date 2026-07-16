import ProductSection from "../components/ProductSection";
import ProductsByCategory from "../components/ProductsByCategory";

export default function Products() {
  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-mdn-green">Catalog</p>
        <h2 className="mt-1 text-2xl font-bold text-mdn-white sm:text-3xl">All Products</h2>
      </div>
      <ProductSection section="best_seller" />
      <ProductSection section="new_arrival" />
      <ProductSection section="fitness_combo" />

      {/* Divided by category */}
      <div className="mx-auto max-w-7xl border-t border-white/5 px-4 pt-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-mdn-green">Browse by category</p>
      </div>
      <ProductsByCategory />
    </div>
  );
}
