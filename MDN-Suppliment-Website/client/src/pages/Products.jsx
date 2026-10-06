import ProductSection from "../components/ProductSection";
import ProductsByCategory from "../components/ProductsByCategory";

const Products = () => (
  <div>
    <div className="mx-auto max-w-shell px-4 pt-6 sm:px-6 sm:pt-8 lg:px-[34px]">
      <p className="eyebrow">Catalog</p>
      <h1 className="display-xl mt-1">All Products</h1>
    </div>
    <ProductSection section="best_seller" />
    <ProductSection section="new_arrival" />
    <ProductSection section="fitness_combo" />

    {/* Divided by category */}
    <div className="mx-auto max-w-shell px-4 pt-2 sm:px-6 lg:px-[34px]">
      <div className="border-t border-mdn-border pt-6">
        <p className="eyebrow">Browse by category</p>
      </div>
    </div>
    <ProductsByCategory />
  </div>
);

export default Products;
