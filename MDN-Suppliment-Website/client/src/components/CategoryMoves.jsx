import { useNavigate } from "react-router-dom";
import SectionHeading from "./SectionHeading";
import ItemCarousel from "./ItemCarousel";

// Same 10 items/links as before. Large screens show every card at once
// in a static grid (no carousel needed); small/medium screens use a
// swipe-only carousel — no autoplay, no arrow buttons, just finger drag.
const COLLECTIONS = [
  { title: "All Products", to: "/products", glyph: "grid" },
  { title: "Whey Protein", to: "/search?q=whey%20protein", glyph: "muscle" },
  { title: "Creatine", to: "/search?q=creatine", glyph: "atom" },
  { title: "Pre-Workout", to: "/search?q=pre%20workout", glyph: "bolt" },
  { title: "BCAA", to: "/search?q=bcaa", glyph: "capsule" },
  { title: "Mass Gainer", to: "/search?q=mass%20gainer", glyph: "gainer" },
  { title: "Fat Burner", to: "/search?q=fat%20burner", glyph: "flame" },
  { title: "Glutamine", to: "/search?q=glutamine", glyph: "leaf" },
  { title: "New Launches", to: "/products/section/new_arrival", glyph: "sparkle" },
  { title: "Combos", to: "/products/section/fitness_combo", glyph: "bundle" },
];

export default function CategoryMoves() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-16">
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
      className="card group flex w-full flex-col items-center gap-1.5 px-1.5 py-3 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-mdn-green/40 hover:shadow-green-glow sm:gap-3 sm:px-4 sm:py-6"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mdn-green/10 text-mdn-green transition-all duration-300 group-hover:scale-110 group-hover:bg-mdn-green group-hover:text-black group-hover:rotate-6 sm:h-12 sm:w-12">
        <Glyph name={item.glyph} />
      </span>
      <span className="line-clamp-2 text-[10px] font-bold leading-tight text-mdn-white transition-colors duration-300 group-hover:text-mdn-green sm:text-base sm:leading-snug">
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
