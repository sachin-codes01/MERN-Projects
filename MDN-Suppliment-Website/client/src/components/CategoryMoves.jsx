import { useNavigate } from "react-router-dom";

const MOVES = [
  { eyebrow: "Save 10%", title: "Build Your Bundle", query: "combo", glyph: "bundle" },
  { eyebrow: "Build", title: "Lean Muscles", query: "whey protein", glyph: "muscle" },
  { eyebrow: "Energy", title: "Pre-Workouts", query: "pre workout", glyph: "bolt" },
  { eyebrow: "Fizz", title: "Hydration", query: "hydration", glyph: "drop" },
  { eyebrow: "Wellness", title: "Lifestyle", query: "wellness", glyph: "leaf" },
  { eyebrow: "Shred", title: "Fat Burner", query: "fat burner", glyph: "flame" },
  { eyebrow: "Eat Right", title: "Protein Foods", query: "protein food", glyph: "bowl" },
];

export default function CategoryMoves() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-mdn-green">Pick a lane</p>
        <h2 className="mt-1 text-3xl font-bold text-mdn-white sm:text-4xl">
          What&rsquo;s Your <span className="text-mdn-green">Move?</span>
        </h2>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-7">
        {MOVES.map((m, i) => (
          <button
            key={m.title}
            onClick={() => navigate(`/search?q=${encodeURIComponent(m.query)}`)}
            style={{ animationDelay: `${i * 60}ms` }}
            className="card group animate-fade-up flex flex-col items-center gap-3 p-4 py-5 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-mdn-green/40 hover:shadow-green-glow"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mdn-green/10 text-mdn-green transition-colors duration-300 group-hover:bg-mdn-green group-hover:text-black">
              <Glyph name={m.glyph} />
            </span>
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-mdn-green">
                {m.eyebrow}
              </span>
              <span className="mt-0.5 block text-sm font-bold leading-tight text-mdn-white sm:text-base">{m.title}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Glyph({ name }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  switch (name) {
    case "bundle":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="8" height="14" rx="1.5" />
          <rect x="13" y="3" width="8" height="18" rx="1.5" />
        </svg>
      );
    case "muscle":
      return (
        <svg {...common}>
          <path d="M4 14c0-3 2-5 2-5s1-3 4-3 4 2 4 2 2-1 4 1c1.5 1.5 1 4 1 4v6H6z" strokeLinejoin="round" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
        </svg>
      );
    case "drop":
      return (
        <svg {...common}>
          <path d="M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z" strokeLinejoin="round" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M5 19c8 1 14-5 14-14C10 5 5 11 5 19z" strokeLinejoin="round" />
        </svg>
      );
    case "flame":
      return (
        <svg {...common}>
          <path d="M12 2s5 4 5 9a5 5 0 01-10 0c0-1 .3-2 .8-2.8.4 1 1.2 1.6 1.7 1 0-2-1.5-3-1-6.2C9.5 4 12 2 12 2z" strokeLinejoin="round" />
        </svg>
      );
    case "bowl":
      return (
        <svg {...common}>
          <path d="M4 11h16a8 8 0 01-16 0z" />
          <path d="M9 11c0-3 1-6 3-6s3 3 3 6" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
