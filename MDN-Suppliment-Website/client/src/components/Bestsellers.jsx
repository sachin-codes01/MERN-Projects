import ProductCarousel from "./ProductCarousel";

const Bestsellers = () => (
  <ProductCarousel
    sectionId="best-sellers"
    className="!pb-5 !pt-6 sm:!pb-10"
    section="best_seller"
    index="04"
    eyebrow="Top rated"
    titleMain="Our"
    titleAccent="Bestsellers"
    subtitle="Most loved and most reordered by our customers"
    moreLink="/products/section/best_seller"
  />
);

export default Bestsellers;
