import { useNavigate } from "react-router-dom";
import ItemCarousel from "./ItemCarousel";
import SectionHeading from "./SectionHeading";
import targetImg from "../assets/Target.png";

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

  // Gutters live on the <section> here (not on the inner max-w-shell div)
  // because the decorative glow/grid behind it must run full bleed — so
  // this element carries the same px steps as every other shell.
  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-16 lg:px-[34px]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full bg-mdn-green/10 blur-[100px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--mdn-white)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--mdn-white)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-shell">
        <SectionHeading
          eyebrow="Goal-based stacks"
          title="What's Your"
          accent="Target?"
          subtitle="Choose your objective to see recommended stacks."
        />

        {/* Single row now, sliding one card at a time — auto-advances,
            pauses on hover, drag/swipe, and arrow buttons — instead of the
            old two-row static grid. */}
        <div className="mt-10">
          <ItemCarousel
            items={TARGETS}
            autoPlay
            interval={3200}
            itemClassName="w-[68%] sm:w-[38%] lg:w-[23%]"
            renderItem={(t) => (
              <button
                onClick={() => navigate(`/search?q=${encodeURIComponent(t.query)}`)}
                className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/5 bg-mdn-charcoal2 transition-all duration-300 hover:-translate-y-1.5 hover:border-mdn-green/40 hover:shadow-green-glow"
              >
                {/* object-fill, not object-cover/contain: the card is
                    aspect-[3/4] (0.750) and Target.png is 896x1200
                    (0.747), so filling the box stretches it by under half
                    a percent — imperceptible, and unlike `cover` it never
                    crops an edge, unlike `contain` it never leaves bars.
                    Sits under the gradient below, which is what keeps the
                    title/description legible over the artwork. */}
                <img
                  src={targetImg}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-fill"
                />
                {/* Scrim, lightened now that there's real artwork behind
                    it. Was solid black at the base fading through 70% at
                    40% height, which greyed out most of the image. Now it
                    holds 85% only right at the bottom edge and drops to
                    30% by 30% height, so the text stays legible while the
                    photo reads clearly above it. */}
                <div className="absolute inset-0 bg-gradient-to-t from-mdn-black/85 via-mdn-black/30 via-30% to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-3 text-left sm:p-4">
                  <span className="block text-sm font-bold leading-tight text-mdn-white sm:text-base">
                    {t.title}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-mdn-gray line-clamp-2">{t.desc}</span>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-mdn-green opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Shop stack
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </button>
            )}
          />
        </div>
      </div>
    </section>
  );
}
