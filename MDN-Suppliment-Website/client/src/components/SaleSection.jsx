import { useEffect, useState } from "react";
import { api } from "../api/api";
import ItemCarousel from "./ItemCarousel";
import ProductCard from "./ProductCard";
import SectionHeading from "./SectionHeading";
import ViewAllLink from "./ViewAllLink";
import Reveal from "./motion/Reveal";

// Home pe "On Sale" — admin ne jin products pe sale badge lagaya hai. Ek bhi
// na ho to poora section chhupa rehta hai (khaali jagah nahi). "View all" →
// /sale page. Navbar me Sale link nahi hai, yahi uska rasta hai.
export default function SaleSection() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api
      .getProducts({ onSale: "true", limit: 16 })
      .then((d) => setProducts(d.data))
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="section">
      <SectionHeading
        align="left"
        eyebrow="Limited time"
        title="On"
        accent="Sale"
        subtitle="Our best prices right now — while stock lasts"
        action={<ViewAllLink to="/sale" />}
      />
      <Reveal from="up" amount={0.15} className="mt-4 sm:mt-6">
        <ItemCarousel
          items={products}
          autoPlay={false}
          showDots={false}
          showProgress
          gapClassName="gap-3 sm:gap-4"
          itemClassName="w-[calc(50%-6px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] xl:w-[calc(20%-13px)]"
          renderItem={(p) => <ProductCard product={p} />}
        />
      </Reveal>
    </section>
  );
}
