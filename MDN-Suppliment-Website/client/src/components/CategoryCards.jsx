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

// Har card ka apna halka rang (photo ke peeche) — row me rangat aur rhythm.
// Alpha wale rang, taaki dark mode me bhi card ke rang pe theek baithein.
const TINTS = [
  ["rgba(132,153,96,0.22)", "rgba(132,153,96,0.06)"], // sage
  ["rgba(234,150,96,0.24)", "rgba(234,150,96,0.06)"], // peach
  ["rgba(110,170,140,0.22)", "rgba(110,170,140,0.06)"], // mint
  ["rgba(120,160,210,0.22)", "rgba(120,160,210,0.06)"], // sky
  ["rgba(228,180,90,0.26)", "rgba(228,180,90,0.07)"], // honey
  ["rgba(170,140,200,0.22)", "rgba(170,140,200,0.06)"], // lilac
  ["rgba(196,150,110,0.24)", "rgba(196,150,110,0.06)"], // caramel
  ["rgba(220,120,120,0.20)", "rgba(220,120,120,0.05)"], // rose
  ["rgba(100,130,90,0.22)", "rgba(100,130,90,0.06)"], // olive
];

const CategoryCard = ({ c, i }) => {
  const [from, to] = TINTS[i % TINTS.length];
  return (
    <Link
      to={c.to}
      className="group flex h-full flex-col rounded-[22px] bg-mdn-charcoal p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-14px_rgba(44,58,20,0.28)] ring-1 ring-mdn-border/70 transition-[transform,box-shadow] duration-300 ease-brand-out hover:-translate-y-1.5 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05),0_22px_40px_-18px_rgba(44,58,20,0.4)] active:scale-[0.98] md:p-2.5"
    >
      {/* Photo: apne rang ke box me, upar halki roshni, product ke neeche saaya */}
      <span
        className="relative block aspect-[4/5] overflow-hidden rounded-[16px] md:aspect-square"
        style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-[12%] top-[8%] h-[60%] rounded-full bg-white/60 blur-2xl"
        />
        <img
          src={c.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="relative h-full w-full scale-[1.04] object-contain p-2 transition-transform duration-500 ease-brand-out [filter:drop-shadow(0_12px_14px_rgba(30,40,20,0.22))] group-hover:scale-[1.12]"
        />
      </span>

      {/* Naam + line baayein, arrow daayein */}
      {/* Phone pe card patla hai — arrow text ke neeche; bade screen pe daayein */}
      <span className="flex flex-1 flex-col items-start justify-between gap-2.5 px-1.5 pb-1 pt-3 md:flex-row md:items-end md:gap-2 md:px-2 md:pb-1.5 md:pt-4">
        <span className="min-w-0">
          <span className="block font-heading text-[14.5px] font-bold leading-tight text-mdn-ink md:text-[17px]">{c.label}</span>
          {c.tagline && (
            <span className="mt-1 block text-[12px] leading-snug text-mdn-ink-muted md:text-[13.5px]">{c.tagline}</span>
          )}
        </span>
        <span
          aria-hidden="true"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-mdn-green text-mdn-on-primary transition-[transform,background-color] duration-300 group-hover:translate-x-0.5 group-hover:bg-mdn-orange-solid md:h-9 md:w-9"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    </Link>
  );
};

const CategoryCards = () => (
  <section className="section !pb-4 !pt-8 md:!pb-10 md:!pt-12">
    <SectionHeading
      align="left"
      eyebrow="Shop by category"
      title="Find What"
      accent="Fuels You"
      subtitle="Pick a goal — we'll show you what works for it"
      action={<ViewAllLink to="/products" />}
    />

    {/* Phone: native swipe. Poori row ek saath animate — har card alag hota to
        kinare pe aadha dikhta card kabhi visible nahi hota */}
    <Reveal
      from="up"
      amount={0.2}
      className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 pt-1 md:hidden"
    >
      {SHOP_CATEGORIES.map((c, i) => (
        <div key={c.label} className="w-[40%] flex-shrink-0 snap-start sm:w-[30%]">
          <CategoryCard c={c} i={i} />
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
        renderItem={(c, i) => <CategoryCard c={c} i={i} />}
      />
    </Reveal>
  </section>
);

export default CategoryCards;
