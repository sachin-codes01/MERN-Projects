import { useNavigate } from "react-router-dom";
import SectionHeading from "./SectionHeading";
import ItemCarousel from "./ItemCarousel";
import allProductsImg from "../assets/All Products.png";
import wheyProteinImg from "../assets/Whey Protein.png";
import creatineImg from "../assets/creatine.png";
import preWorkoutImg from "../assets/pre workout.png";
import bcaaImg from "../assets/bcaa.png";
import massGainerImg from "../assets/mass gainer.png";
import fatBurnerImg from "../assets/fat burner.png";
import glutamineImg from "../assets/glutamine.png";
import newLaunchesImg from "../assets/New Launches.png";
import combosImg from "../assets/Combos.png";

// Same 10 items/links as before. Large screens show every card at once
// in a static grid (no carousel needed); small/medium screens use a
// swipe-only carousel — no autoplay, no arrow buttons, just finger drag.
//
// Every collection now carries its own transparent cut-out, matched to
// the title by name. `glyph` is kept as the fallback for any collection
// added later before its artwork exists.
const COLLECTIONS = [
  { title: "All Products", to: "/products", glyph: "grid", image: allProductsImg },
  { title: "Whey Protein", to: "/search?q=whey%20protein", glyph: "muscle", image: wheyProteinImg },
  { title: "Creatine", to: "/search?q=creatine", glyph: "atom", image: creatineImg },
  { title: "Pre-Workout", to: "/search?q=pre%20workout", glyph: "bolt", image: preWorkoutImg },
  { title: "BCAA", to: "/search?q=bcaa", glyph: "capsule", image: bcaaImg },
  { title: "Mass Gainer", to: "/search?q=mass%20gainer", glyph: "gainer", image: massGainerImg },
  { title: "Fat Burner", to: "/search?q=fat%20burner", glyph: "flame", image: fatBurnerImg },
  { title: "Glutamine", to: "/search?q=glutamine", glyph: "leaf", image: glutamineImg },
  { title: "New Launches", to: "/products/section/new_arrival", glyph: "sparkle", image: newLaunchesImg },
  { title: "Combos", to: "/products/section/fitness_combo", glyph: "bundle", image: combosImg },
];

export default function CategoryMoves() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-shell px-4 py-6 sm:px-6 lg:px-[34px] sm:py-16">
      <SectionHeading eyebrow="Explore" title="Shop by" accent="Collection" />

      {/* Large screens: every card shown at once in a static grid — no
          carousel needed since there's room for all 10.
          Small/medium screens: a swipe-only carousel — no autoplay, no
          arrow buttons, just finger/touch drag.
          mt-4 on mobile (vs. sm:mt-10) — the fuller sm+ gap was leaving a
          big empty band above the cards on phones, where the section is
          otherwise short. */}
      <div className="mt-4 sm:mt-10">
        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-4">
          {COLLECTIONS.map((c) => (
            <CollectionCard key={c.title} item={c} onClick={() => navigate(c.to)} />
          ))}
        </div>

        <div className="lg:hidden">
          <ItemCarousel
            items={COLLECTIONS}
            autoPlay={false}
            showArrows={false}
            showDots={false}
            gapClassName="gap-3"
            itemClassName="w-[26%] sm:w-[19%]"
            renderItem={(c) => <CollectionCard item={c} onClick={() => navigate(c.to)} />}
          />
        </div>
      </div>
    </section>
  );
}

function CollectionCard({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card group flex h-full w-full flex-col items-center gap-1.5 px-1.5 py-2 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-mdn-green/40 hover:shadow-green-glow sm:gap-1.5 sm:px-2 sm:py-2"
    >
      {/* SQUARE box sized to ~71% of the desktop card. The cap has been
          tuned by eye: at 112px the artwork filled only 43% of the card and
          read as a small icon adrift in padding; uncapped it went to 234px
          (90%) and dominated the card. 184px sits between the two.
          The cap only binds from `sm` up — in the narrow mobile carousel
          the slot is ~75px, so the box just fills it either way.
          Both the image and the glyph fallback live in this same box, so
          every card is identical in height whichever one renders — that's
          what keeps the row aligned. */}
      <span className="relative flex aspect-square w-full max-w-[184px] shrink-0 items-center justify-center">
        {/* Glow behind the cut-out, pooled low so it sits under the
            product's base rather than floating behind its middle. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[4%] left-1/2 h-[62%] w-[78%] -translate-x-1/2 rounded-full bg-mdn-green/25 blur-[16px] transition-all duration-300 group-hover:bg-mdn-green/50 group-hover:blur-[22px]"
        />
        {item.image ? (
          // `absolute inset-0` rather than `h-full w-full` in flow: a
          // percentage height has nothing definite to resolve against
          // inside an aspect-ratio box, so an in-flow image falls back to
          // its intrinsic height and stretches the box past square —
          // which is exactly what staircased the navbar's tiles. Out of
          // flow it can't affect the box, so every card stays square
          // whatever the source ratio (these run 0.67 to 1.11).
          //
          // alt="" — the title below is inside the same button and
          // already names it, so alt text would just double-announce.
          <img
            src={item.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_3px_8px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-mdn-green/10 text-mdn-green transition-all duration-300 group-hover:scale-110 group-hover:bg-mdn-green group-hover:text-black sm:h-12 sm:w-12">
            <Glyph name={item.glyph} />
          </span>
        )}
      </span>
      {/* The 2-line reserve is only needed where titles actually wrap — in
          the narrow mobile carousel. From `sm` up the card is wide enough
          that every title fits on one line, so reserving a second line
          there just left an empty row of dead space under each card. Cards
          stay equal height without it: `h-full` above makes the button
          fill its grid/carousel slot, and the fixed square image box keeps
          every label starting at the same y. */}
      <span className="line-clamp-2 min-h-[2.5em] text-[10px] font-bold leading-tight text-mdn-white transition-colors duration-300 group-hover:text-mdn-green sm:min-h-0 sm:text-xs">
        {item.title}
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
