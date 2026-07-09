import { useEffect, useState } from "react";

const CYCLE_WORDS = ["PURE.", "TESTED.", "POWERFUL.", "TRUSTED."];

const INTRO =
  "Consuming proper dietary requirements is critical for maintaining optimal health, growth, and function throughout life. Our body gets energy from the food we eat and the drinks we consume.";

const MORE =
  "The misapplication of vital nutrients can be a problem for healthy individuals and ageing adults alike, as well as for anyone with conditions that call for higher protein needs. That's why MDN builds every formula around clean, verifiable nutrition — no shortcuts, no filler. We test what we ship, and we stand behind the label.";

export default function Hero() {
  const [expanded, setExpanded] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % CYCLE_WORDS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-mdn-charcoal to-mdn-black">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="animate-fade-up">
          <span className="inline-block rounded-full border border-mdn-green/40 bg-mdn-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-mdn-green">
            My Daily Nutrition
          </span>

          <h1 className="mt-4 text-3xl font-bold leading-tight text-mdn-white sm:text-4xl lg:text-5xl">
            Best Bodybuilding &amp; <span className="text-mdn-green">Gym Supplements</span> Online
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-mdn-gray sm:text-base">
            {INTRO}
            <span
              className={`grid transition-all duration-500 ease-in-out ${
                expanded ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <span className="overflow-hidden">{MORE}</span>
            </span>
          </p>

          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-2 text-sm font-semibold text-mdn-green transition-colors hover:text-mdn-green-light"
          >
            {expanded ? "Show less ↑" : "Read More →"}
          </button>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="stat-chip">
              <span className="stat-chip-value">26g</span>
              <span className="stat-chip-label">Protein</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-value">5.5g</span>
              <span className="stat-chip-label">BCAA</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-value">0g</span>
              <span className="stat-chip-label">Sugar</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-value">ISO</span>
              <span className="stat-chip-label">Certified</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#best-sellers" className="btn-primary">
              Shop Best Sellers
            </a>
            <a href="#faq" className="btn-secondary">
              Learn More
            </a>
          </div>
        </div>

        <div className="relative flex min-h-[280px] flex-col items-center justify-center gap-3 px-2 text-center lg:min-h-[420px]">
          {/* Soft floating glow, no box */}
          <div className="absolute h-72 w-72 animate-[pulse_4s_ease-in-out_infinite] rounded-full bg-mdn-green/25 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 animate-[pulse_5s_ease-in-out_infinite] rounded-full bg-mdn-green/15 blur-2xl [animation-delay:1s]" />

          <span className="relative text-xs font-semibold uppercase tracking-[0.3em] text-mdn-gray">
            Formulated to be
          </span>

          {/* Big cycling word — clamp() keeps it from ever overflowing/clipping */}
          <p
            key={wordIndex}
            className="relative w-full animate-fade-up font-display font-bold leading-none tracking-tight text-mdn-green drop-shadow-[0_0_45px_rgba(34,177,76,0.55)]"
            style={{ fontSize: "clamp(2.6rem, 9vw, 7rem)" }}
          >
            {CYCLE_WORDS[wordIndex]}
          </p>

          <p className="relative max-w-xs text-sm text-mdn-gray">
            Every batch lab-tested. Every label honest. No shortcuts.
          </p>

          <div className="relative mt-2 flex justify-center gap-2">
            {CYCLE_WORDS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === wordIndex ? "w-6 bg-mdn-green" : "w-1.5 bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}