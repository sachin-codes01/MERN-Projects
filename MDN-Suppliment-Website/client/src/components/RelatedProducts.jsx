import { useEffect, useState } from "react";
import { api } from "../api/api";
import ProductCard from "./ProductCard";
import ItemCarousel from "./ItemCarousel";
import SectionHeading from "./SectionHeading";

/**
 * "Related Products" row on the product detail page.
 *
 * Relatedness is drawn from three rings, nearest first:
 *   1. same `productType` — another whey next to a whey, which is the
 *      genuinely comparable set;
 *   2. same `category` — the wider net, used to top the row up when a
 *      product type has few siblings;
 *   3. anything else in the catalogue, SHUFFLED — the fill ring.
 *
 * Ring 3 exists because rings 1 and 2 can both come back empty: a product
 * that is the only one of its type in its category had no siblings at all,
 * so the section vanished entirely on those pages. Now the row always has
 * something in it, with the genuinely related items leading and random
 * ones only ever making up the tail.
 *
 * Results are merged in ring order and de-duplicated, so the closest
 * matches always lead and nothing appears twice.
 *
 * Built on the same ItemCarousel + ProductCard pair as the home page's
 * Bestsellers row, so the cards, the trackpad/drag scrolling and the
 * arrow buttons all behave identically here.
 */
export default function RelatedProducts({ product }) {
  const [items, setItems] = useState([]);

  const productId = product?._id;
  const productType = product?.productType;
  // getProductBySlug populates `category`, but list responses return it as
  // a bare id — accept either shape rather than assuming one.
  const categoryId = product?.category?._id || product?.category;

  useEffect(() => {
    if (!productId) return;
    // Guards against a slower request for the PREVIOUS product resolving
    // after the user has already navigated to another one and overwriting
    // the new row.
    let cancelled = false;

    const empty = Promise.resolve({ data: [] });
    Promise.all([
      productType ? api.getProducts({ productType, limit: 16 }) : empty,
      categoryId ? api.getProducts({ category: categoryId, limit: 16 }) : empty,
      api.getProducts({ limit: 24 }), // ring 3 — the catalogue-wide fill
    ])
      .then(([byType, byCategory, anyProduct]) => {
        if (cancelled) return;

        const seen = new Set([productId]); // never recommend the page you're on
        const merged = [];
        const take = (list) => {
          for (const p of list || []) {
            if (seen.has(p._id)) continue;
            seen.add(p._id);
            merged.push(p);
          }
        };

        take(byType.data);
        take(byCategory.data);

        // Fisher-Yates on whatever is left, so the filler differs between
        // visits instead of always being the newest few products in the
        // same order. Only the TAIL is random — anything genuinely related
        // was already taken above.
        const rest = (anyProduct.data || []).filter((p) => !seen.has(p._id));
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        take(rest);

        setItems(merged.slice(0, 16));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, productType, categoryId]);

  // Only hides while the fetch is still in flight, or if the catalogue
  // genuinely holds nothing but this one product. With the fill ring above
  // that is now the only case where the section is absent.
  if (items.length === 0) return null;

  return (
    // No max-w-shell / px-* here: this sits INSIDE the product page's
    // existing shell, so adding its own would double the gutters. Matches
    // the spacing ProductReviews below it uses.
    <section className="mt-16 border-t border-mdn-border pt-10">
      <SectionHeading eyebrow="You may also like" title="Related" accent="Products" />

      <div className="mt-8">
        <ItemCarousel
          items={items}
          // No autoplay — like Bestsellers, this only moves when the user
          // scrolls, drags or clicks an arrow.
          autoPlay={false}
          showDots={false}
          gapClassName="gap-4"
          // Same widths as the home page's product rows, so a card is the
          // same size wherever it appears.
          itemClassName="w-[47%] sm:w-[31%] lg:w-[18.4%]"
          renderItem={(p) => <ProductCard product={p} />}
        />
      </div>
    </section>
  );
}
