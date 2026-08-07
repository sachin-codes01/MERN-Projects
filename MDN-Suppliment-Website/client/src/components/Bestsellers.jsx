import ProductCarousel from "./ProductCarousel";

export default function Bestsellers() {
  return (
    <ProductCarousel
      sectionId="best-sellers"
      section="best_seller"
      index="04"
      eyebrow="Top rated"
      titleMain="Our"
      titleAccent="Bestsellers"
      moreLink="/products/section/best_seller"
    />
  );
}
