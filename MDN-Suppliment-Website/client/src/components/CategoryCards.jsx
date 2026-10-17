import { Link } from "react-router-dom";
import SectionHeading from "./SectionHeading";
import ViewAllLink from "./ViewAllLink";
import Reveal from "./motion/Reveal";
import { SHOP_CATEGORIES } from "../data/shopCategories";

// Sirf phone/chhote tablet (md se neeche) — "Shop by category" bade cards:
// photo, naam, chhoti line, aur gol arrow button. Side me swipe.
// Bade screen pe yeh section dikhta hi nahi (wahan "Shop by Collection" ke
// neeche wali icon row hai, bina badlav ke).
const CategoryCards = () => (
  <section className="section !pb-4 !pt-8 md:hidden">
    <SectionHeading
      align="left"
      eyebrow="Shop by category"
      title="Find What"
      accent="Fuels You"
      action={<ViewAllLink to="/products" />}
    />

    {/* Poori row ek saath animate — har card alag hota to kinare pe jhaankta
        (aadha dikhta) card kabhi visible nahi hota */}
    <Reveal from="up" amount={0.2} className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 pt-1">
      {SHOP_CATEGORIES.map((c) => (
        <div key={c.label} className="w-[38%] flex-shrink-0 snap-start sm:w-[30%]">
          <Link
            to={c.to}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-mdn-border bg-mdn-charcoal shadow-xs transition-transform duration-300 active:scale-[0.98]"
          >
            <span className="block aspect-square overflow-hidden bg-mdn-sand">
              <img
                src={c.image}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain p-2 transition-transform duration-500 ease-brand-out group-hover:scale-105"
              />
            </span>
            <span className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
              <span className="font-heading text-[15px] font-bold leading-tight text-mdn-ink">{c.label}</span>
              {c.tagline && <span className="mt-0.5 text-[12.5px] leading-snug text-mdn-ink-muted">{c.tagline}</span>}
              <span
                aria-hidden="true"
                className="mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-mdn-green text-mdn-on-primary transition-transform duration-300 group-hover:translate-x-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          </Link>
        </div>
      ))}
    </Reveal>
  </section>
);

export default CategoryCards;
