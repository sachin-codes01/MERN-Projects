import { Link } from "react-router-dom";
import Reveal from "./motion/Reveal";
import { SHOP_CATEGORIES } from "../data/shopCategories";

// Saari shop categories ki icon row (All Products, Whey Protein ... Accessories).
// "Shop by Collection" ke cards ke neeche dikhti hai. Phone pe side me swipe,
// bade screen pe jagah ho to ek centred row.
const CategoryRail = ({ className = "" }) => (
  <nav
    aria-label="Shop by category"
    className={`no-scrollbar -mx-4 overflow-x-auto px-4 pb-5 pt-2 sm:-mx-6 sm:px-6 sm:pt-3 ${className}`}
  >
    {/* overflow-x-auto vertical bhi clip karta hai — pt/pb ki jagah hover lift (-4px)
        aur shadow ko kaatne se bachati hai.
        w-max + mx-auto: jagah ho to row centre me, kam ho to pehle item se scroll (clip nahi) */}
    <ul className="mx-auto flex w-max gap-3 sm:gap-4 xl:gap-5">
      {SHOP_CATEGORIES.map((c, i) => (
        <Reveal as="li" key={c.label} from="up" delay={Math.min(i, 6) * 0.05} amount={0.4} className="flex-shrink-0">
          <Link to={c.to} className="group flex w-[92px] flex-col items-center gap-2 sm:w-[112px] xl:w-[136px]">
            <span className="flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-2xl border border-mdn-border-strong/70 bg-mdn-charcoal shadow-xs transition-[transform,box-shadow,border-color] duration-300 ease-brand-out group-hover:-translate-y-1 group-hover:border-mdn-green/50 group-hover:shadow-lg group-active:scale-95 sm:h-[100px] sm:w-[100px] xl:h-[124px] xl:w-[124px]">
              <img
                src={c.image}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="h-[92%] w-[92%] object-contain transition-transform duration-500 ease-brand-out group-hover:scale-110"
              />
            </span>
            <span className="text-center font-heading text-[12.5px] font-bold leading-tight text-mdn-ink transition-colors group-hover:text-mdn-green sm:text-[14px] xl:text-[15px]">
              {c.label}
            </span>
          </Link>
        </Reveal>
      ))}
    </ul>
  </nav>
);

export default CategoryRail;
