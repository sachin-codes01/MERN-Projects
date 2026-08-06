import { useNavigate } from "react-router-dom";
import SectionHeading from "./SectionHeading";
import ItemCarousel from "./ItemCarousel";
// Full collection posters (not the transparent cut-outs the navbar uses)
// — these fill the whole card, so no separate artwork or tint is needed.
// NOTE: the glutamine file is spelled "colection" (one l) on disk.
import allProductsImg from "../assets/All Products-collection.png";
import wheyProteinImg from "../assets/Whey Protein-collection.png";
import creatineImg from "../assets/creatine-collection.png";
import preWorkoutImg from "../assets/pre workout-collection.png";
import bcaaImg from "../assets/bcaa-collection.png";
import massGainerImg from "../assets/mass gainer-collection.png";
import fatBurnerImg from "../assets/fat burner-collection.png";
import glutamineImg from "../assets/glutamine-colection.png";
import newLaunchesImg from "../assets/New Launches-collection.png";
import combosImg from "../assets/Combos-collection.png";
// Same outlined icon family as the "Why Choose MDN" feature grid, so the
// two sections read as one system rather than two icon styles.
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import VaccinesOutlinedIcon from "@mui/icons-material/VaccinesOutlined";
import MonitorWeightOutlinedIcon from "@mui/icons-material/MonitorWeightOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import RedeemOutlinedIcon from "@mui/icons-material/RedeemOutlined";

// Same 10 items/links as before. Large screens show every card at once
// in a static grid (no carousel needed); small/medium screens use a
// swipe-only carousel — no autoplay, no arrow buttons, just finger drag.
//
// Every collection now carries its own transparent cut-out, matched to
// the title by name. `glyph` is kept as the fallback for any collection
// added later before its artwork exists.
// `Icon` is the small outlined mark that sits to the LEFT of the title,
// as in the reference. `glyph` is unrelated and still the fallback ART
// used in place of the product cut-out when a collection has no image —
// the two are different slots, so both stay.
const COLLECTIONS = [
  { title: "All Products", to: "/products", glyph: "grid", image: allProductsImg, Icon: GridViewOutlinedIcon },
  { title: "Whey Protein", to: "/search?q=whey%20protein", glyph: "muscle", image: wheyProteinImg, Icon: FitnessCenterOutlinedIcon },
  { title: "Creatine", to: "/search?q=creatine", glyph: "atom", image: creatineImg, Icon: ScienceOutlinedIcon },
  { title: "Pre-Workout", to: "/search?q=pre%20workout", glyph: "bolt", image: preWorkoutImg, Icon: BoltOutlinedIcon },
  { title: "BCAA", to: "/search?q=bcaa", glyph: "capsule", image: bcaaImg, Icon: VaccinesOutlinedIcon },
  { title: "Mass Gainer", to: "/search?q=mass%20gainer", glyph: "gainer", image: massGainerImg, Icon: MonitorWeightOutlinedIcon },
  { title: "Fat Burner", to: "/search?q=fat%20burner", glyph: "flame", image: fatBurnerImg, Icon: LocalFireDepartmentOutlinedIcon },
  { title: "Glutamine", to: "/search?q=glutamine", glyph: "leaf", image: glutamineImg, Icon: SpaOutlinedIcon },
  { title: "New Launches", to: "/products/section/new_arrival", glyph: "sparkle", image: newLaunchesImg, Icon: AutoAwesomeOutlinedIcon },
  { title: "Combos", to: "/products/section/fitness_combo", glyph: "bundle", image: combosImg, Icon: RedeemOutlinedIcon },
];

export default function CategoryMoves() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-shell px-4 py-6 sm:px-6 sm:py-12 lg:px-[34px]">
      <SectionHeading eyebrow="Explore" title="Shop by" accent="Collection" />

      {/* One scrollable row at every size — same ItemCarousel the home
          page's Bestsellers uses, so trackpad scrolling, drag and the
          arrow buttons all behave identically. This replaced a static
          5-across grid on desktop plus a separate mobile carousel; with
          ten collections the grid wrapped to two rows, which is not the
          single row the reference shows. */}
      <div className="mt-4 sm:mt-10">
        <ItemCarousel
          items={COLLECTIONS}
          autoPlay={false}
          showDots={false}
          gapClassName="gap-4"
          // Sits between 4 and 5 across on desktop: the fifth card is only
          // part-visible at the right edge, which also hints that the row
          // scrolls rather than looking like a complete set of four.
          itemClassName="w-[56%] sm:w-[34%] lg:w-[21%]"
          renderItem={(c) => <CollectionCard item={c} onClick={() => navigate(c.to)} />}
        />
      </div>
    </section>
  );
}

function CollectionCard({ item, onClick }) {
  const Icon = item.Icon;
  return (
    // aspect-[25/32] rather than a squarer card: the posters are ~0.88
    // wide-to-tall, and once the 48px label bar is subtracted this leaves
    // the image area at almost exactly that ratio — so `object-fill`
    // barely has to stretch anything. (Was 10/13; 25/32 trims ~5px off the
    // card height at the current width without touching the label bar.)
    <button
      onClick={onClick}
      className="group flex aspect-[25/32] w-full flex-col overflow-hidden rounded-2xl text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
    >
      <span className="relative flex-1 overflow-hidden bg-mdn-sand">
        {item.image ? (
          // object-fill, NOT cover/contain: cover crops the poster's edges
          // (the headline and the MDN logo sit right at the top), contain
          // letterboxes it and leaves bands of empty card. Fill shows the
          // WHOLE poster, stretched to the box.
          //
          // alt="" — the label below is inside the same button and already
          // names the collection, so alt text would just double-announce.
          <img
            src={item.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-fill transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-mdn-green [&>svg]:h-16 [&>svg]:w-16">
            <Glyph name={item.glyph} />
          </span>
        )}
      </span>

      {/* Label bar. Same height on every card, so the row of labels lines
          up however long the names are. */}
      <span className="flex items-center justify-center gap-2 bg-mdn-ink px-3 py-3.5">
        {Icon && <Icon aria-hidden="true" className="shrink-0 text-white/70" sx={{ fontSize: 17 }} />}
        <span className="truncate text-[13px] font-semibold text-white sm:text-sm">{item.title}</span>
      </span>
    </button>
  );
}

function Glyph({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      );
    case "muscle":
      return (
        <svg {...common}>
          <path d="M4 14c0-3 2-5 2-5s1-3 4-3 4 2 4 2 2-1 4 1c1.5 1.5 1 4 1 4v6H6z" strokeLinejoin="round" />
        </svg>
      );
    case "atom":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
          <ellipse cx="12" cy="12" rx="9" ry="3.6" />
          <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
        </svg>
      );
    case "capsule":
      return (
        <svg {...common}>
          <rect x="4" y="9" width="16" height="6" rx="3" transform="rotate(45 12 12)" />
          <line x1="12" y1="7.5" x2="12" y2="16.5" transform="rotate(45 12 12)" strokeLinecap="round" />
        </svg>
      );
    case "gainer":
      return (
        <svg {...common}>
          <path d="M4 18l5-5 4 4 7-8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 9h5v5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "flame":
      return (
        <svg {...common}>
          <path d="M12 2s5 4 5 9a5 5 0 01-10 0c0-1 .3-2 .8-2.8.4 1 1.2 1.6 1.7 1 0-2-1.5-3-1-6.2C9.5 4 12 2 12 2z" strokeLinejoin="round" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M5 19c8 1 14-5 14-14C10 5 5 11 5 19z" strokeLinejoin="round" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
        </svg>
      );
    case "bundle":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="8" height="14" rx="1.5" />
          <rect x="13" y="3" width="8" height="18" rx="1.5" />
        </svg>
      );
    default:
      return null;
  }
}
