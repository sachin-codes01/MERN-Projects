import { Link } from "react-router-dom";
import SectionHeading from "./SectionHeading";
import ViewAllLink from "./ViewAllLink";
import ItemCarousel from "./ItemCarousel";
import Reveal from "./motion/Reveal";
import { SHOP_CATEGORIES } from "../data/shopCategories";

// "Shop by category — Find What Fuels You": har category ka card — photo,
// naam, chhoti line aur gol arrow button. Har screen pe:
//   phone: side me swipe (agla card aadha jhaankta hai)
//   tablet/desktop: carousel, arrows ke saath (desktop pe ek baar me 6 card)

const CategoryCard = ({ c }) => (
  <Link
    to={c.to}
    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-mdn-border bg-mdn-charcoal shadow-xs transition-[transform,box-shadow] duration-300 ease-brand-out hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
  >
    <span className="block aspect-square overflow-hidden bg-mdn-sand md:aspect-[5/4]">
      <img
        src={c.image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain p-2 transition-transform duration-500 ease-brand-out group-hover:scale-105 md:scale-[1.12] md:p-1 md:group-hover:scale-[1.18]"
      />
    </span>
    <span className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3 md:px-5 md:pb-5 md:pt-4">
      <span className="font-heading text-[15px] font-bold leading-tight text-mdn-ink md:text-[18px]">{c.label}</span>
      {c.tagline && <span className="mt-0.5 text-[12.5px] leading-snug text-mdn-ink-muted md:mt-1 md:text-[14.5px]">{c.tagline}</span>}
      <span
        aria-hidden="true"
        className="mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-mdn-green text-mdn-on-primary transition-transform duration-300 group-hover:translate-x-1 md:mt-4 md:h-10 md:w-10"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </span>
  </Link>
);

const CategoryCards = () => (
  <section className="section !pb-4 !pt-8 md:!pb-10 md:!pt-12">
    <SectionHeading
      align="left"
      eyebrow="Shop by category"
      title="Find What"
      accent="Fuels You"
      action={<ViewAllLink to="/products" />}
    />

    {/* Phone: native swipe. Poori row ek saath animate — har card alag hota to
        kinare pe aadha dikhta card kabhi visible nahi hota */}
    <Reveal
      from="up"
      amount={0.2}
      className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 pt-1 md:hidden"
    >
      {SHOP_CATEGORIES.map((c) => (
        <div key={c.label} className="w-[38%] flex-shrink-0 snap-start sm:w-[30%]">
          <CategoryCard c={c} />
        </div>
      ))}
    </Reveal>

    {/* Tablet/desktop: arrows wala carousel — desktop pe 6 card dikhte hain */}
    <Reveal from="up" amount={0.15} className="mt-7 hidden md:block">
      <ItemCarousel
        items={SHOP_CATEGORIES}
        autoPlay={false}
        showDots={false}
        gapClassName="gap-4 lg:gap-5"
        itemClassName="md:w-[calc(25%-12px)] lg:w-[calc(20%-16px)] xl:w-[calc(16.666%-17px)]"
        renderItem={(c) => <CategoryCard c={c} />}
      />
    </Reveal>
  </section>
);

export default CategoryCards;
