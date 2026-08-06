import { useNavigate } from "react-router-dom";
import SectionHeading from "./SectionHeading";
// Square product posters (not the transparent cut-outs the navbar uses)
// — these fill the whole card, so no separate artwork or tint is needed.
// NOTE: two files are spelled "Protines"/"isolete" on disk.
import proteinImg from "../assets/Protines.jpeg";
import creatineImg from "../assets/creatine.jpeg";
import isolateImg from "../assets/isolete.jpeg";
import collagenImg from "../assets/Collagen.jpeg";
// Same outlined icon family as the "Why Choose MDN" feature grid, so the
// two sections read as one system rather than two icon styles.
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";

// Four collections only. `Icon` is the small outlined mark that sits to
// the LEFT of the title; `glyph` is a different slot — the fallback ART
// drawn in place of the poster if a collection ever has no image.
const COLLECTIONS = [
  { title: "Protein", to: "/search?q=whey%20protein", glyph: "muscle", image: proteinImg, Icon: FitnessCenterOutlinedIcon },
  { title: "Creatine", to: "/search?q=creatine", glyph: "atom", image: creatineImg, Icon: ScienceOutlinedIcon },
  { title: "Isolate", to: "/search?q=isolate", glyph: "bolt", image: isolateImg, Icon: BoltOutlinedIcon },
  { title: "Collagen", to: "/search?q=collagen", glyph: "leaf", image: collagenImg, Icon: SpaOutlinedIcon },
];

export default function CategoryMoves() {
  const navigate = useNavigate();

  return (
    // Bottom padding is the top's step plus 5px (24→29, 48→53), so the gap
    // down to "The Story of MDN" reads a touch more open than the gap above.
    <section className="mx-auto max-w-shell px-4 pb-[29px] pt-6 sm:px-6 sm:pb-[53px] sm:pt-12 lg:px-[34px]">
      <SectionHeading eyebrow="Explore" title="Shop by" accent="Collection" />

      {/* Static grid, no carousel: with only four cards everything fits.
          Two per row on phones (so the last two wrap onto a second row),
          four across from the lg breakpoint up. */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-4">
        {COLLECTIONS.map((c) => (
          <CollectionCard key={c.title} item={c} onClick={() => navigate(c.to)} />
        ))}
      </div>
    </section>
  );
}

function CollectionCard({ item, onClick }) {
  const Icon = item.Icon;
  return (
    // No aspect ratio on the button itself — the posters are square, so the
    // image area carries `aspect-square` and the label bar simply adds its
    // own height below it. Every card is the same width in the grid, so the
    // labels still line up across the row.
    <button
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden rounded-2xl text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
    >
      <span className="relative aspect-square overflow-hidden bg-mdn-sand">
        {item.image ? (
          // object-cover with square art in a square box is a no-op crop —
          // it just guards against a non-square file being dropped in later.
          //
          // alt="" — the label below is inside the same button and already
          // names the collection, so alt text would just double-announce.
          <img
            src={item.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
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
