import { useNavigate } from "react-router-dom";
import targetImg from "../assets/mdn-0.png"; // swap per-card image later

const TARGETS = [
  {
    title: "Lean Muscles",
    query: "lean muscle",
    desc: "High-protein, low-carb stacks built for definition without the bulk.",
  },
  {
    title: "Guilt-Free Gains",
    query: "protein food",
    desc: "Clean whole-food nutrition that fits real macros, not marketing.",
  },
  {
    title: "Weight Loss",
    query: "fat loss",
    desc: "Fat burners and low-sugar formulas to support a real calorie deficit.",
  },
  {
    title: "Wellness & Immunity",
    query: "wellness",
    desc: "Daily essentials — multivitamins, omega-3s, gut and immune support.",
  },
  {
    title: "Strength & Endurance",
    query: "pre workout",
    desc: "Pre-workouts and creatine to push harder, longer, every session.",
  },
  {
    title: "Bulking Up",
    query: "mass gainer",
    desc: "Calorie-dense mass gainers built for serious, sustained size gains.",
  },
];

export default function TargetSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-6">
      {/* Decorative background — same soft glow + faint grid treatment used
          in the "Story of MDN" section, so this section carries the same
          visual language instead of feeling like a plain grid dropped in. */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full bg-mdn-green/10 blur-[100px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--mdn-white)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--mdn-white)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-mdn-green">Goal-based stacks</p>
          <h2 className="mt-1 text-3xl font-bold text-mdn-white sm:text-4xl">
            What&rsquo;s Your <span className="text-mdn-green">Target?</span>
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-mdn-gray sm:text-base">
            Choose your objective to see recommended stacks.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {TARGETS.map((t, i) => (
            <button
              key={t.title}
              onClick={() => navigate(`/search?q=${encodeURIComponent(t.query)}`)}
              style={{ animationDelay: `${i * 70}ms` }}
              className="group animate-fade-up relative aspect-[4/5] overflow-hidden rounded-xl border border-white/5 bg-mdn-charcoal2 transition-all duration-300 hover:-translate-y-1.5 hover:border-mdn-green/40 hover:shadow-green-glow sm:aspect-[3/4]"
            >
              {/* object-contain on purpose — object-cover was cropping the
                  placeholder photo awkwardly inside these tall tiles. */}
              <img
                src={targetImg}
                alt={t.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-contain object-bottom p-2 transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient made taller + a touch darker at the base (via/to
                  stops added) — previously it only covered enough space
                  for the title, so once a description line was added
                  underneath, that second line sat on bare image/background
                  with no contrast. Now the readable zone covers both
                  lines comfortably in every tile size. */}
              <div className="absolute inset-0 bg-gradient-to-t from-mdn-black via-mdn-black/70 via-40% to-transparent" />

              {/* Description added below the title so tiles don't read as
                  empty photo-plus-label — always visible (not hover-only)
                  since a title-only card was the actual emptiness
                  complaint, not just the "Shop stack" hover link. */}
              <span className="absolute inset-x-0 bottom-0 p-3 text-left sm:p-4">
                <span className="block text-sm font-bold leading-tight text-mdn-white sm:text-base">
                  {t.title}
                </span>
                <span className="mt-1 block text-xs leading-snug text-mdn-gray line-clamp-2">
                  {t.desc}
                </span>
                <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-mdn-green opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Shop stack
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}