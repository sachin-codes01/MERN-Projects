import { useState } from "react";

const SHORT_STORY =
  "MDN started in a small home gym with a simple frustration: every \"premium\" supplement on the shelf was either overpriced, under-dosed, or both. So we built our own — tested, transparent, and priced for people who actually train.";

const FULL_STORY =
  "MDN started in a small home gym with a simple frustration: every \"premium\" supplement on the shelf was either overpriced, under-dosed, or both. So we built our own — tested, transparent, and priced for people who actually train. Every batch that carries the MDN name is lab-verified before it ships, because the label should mean something. We work directly with GMP-certified facilities, publish real BCAA and protein numbers instead of marketing rounding, and keep sugar out of formulas that don't need it. What began as protein for a handful of lifters at one gym has grown into a full line — isolates, pre-workouts, glutamine, fat burners — trusted by athletes across the country who train for results, not hype. We're still run by people who lift, and we still test everything on ourselves first.";

const STATS = [
  { value: "2019", label: "Founded" },
  { value: "500+", label: "Batches Lab-Tested" },
  { value: "2,00,000+", label: "Athletes Trust Us" },
  { value: "GMP", label: "Certified Facilities" },
];

const MILESTONES = [
  { year: "2019", text: "Started with one whey formula, tested on our own home gym." },
  { year: "2021", text: "Went GMP-certified and expanded into isolates & glutamine." },
  { year: "2023", text: "Crossed 1,00,000 athletes served across India." },
  { year: "2025", text: "Full stack line — pre-workouts, fat burners, wellness." },
];

export default function StorySection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-mdn-charcoal py-20 sm:py-28">
      {/* Decorative background — soft glow + faint grid, no photo by design */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/3 rounded-full bg-mdn-green/10 blur-[110px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--mdn-white)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--mdn-white)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-mdn-green/10" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full border border-mdn-green/10" />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.3em] text-mdn-green">
          Our Journey
        </p>
        <h2 className="mt-3 animate-fade-up text-3xl font-bold text-mdn-white [animation-delay:80ms] sm:text-4xl lg:text-5xl">
          The Story of <span className="text-mdn-green">MDN</span>
        </h2>

        <p className="mt-6 animate-fade-up text-sm leading-relaxed text-mdn-gray [animation-delay:160ms] sm:text-base">
          {expanded ? FULL_STORY : SHORT_STORY}
        </p>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-mdn-green transition-colors hover:text-mdn-green-light"
        >
          {expanded ? "Read less" : "Read more"}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Pull-quote */}
        <blockquote className="animate-fade-up mx-auto mt-10 max-w-xl border-l-2 border-mdn-green/50 pl-5 text-left text-base font-semibold italic leading-relaxed text-mdn-white/90 sm:text-lg">
          "We're still run by people who lift, and we still test everything on ourselves first."
        </blockquote>

        {/* Stats row */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              style={{ animationDelay: `${i * 90}ms` }}
              className="animate-fade-up rounded-xl border border-mdn-green/20 bg-mdn-charcoal2 px-3 py-5 transition-transform duration-300 hover:-translate-y-1"
            >
              <p className="font-display text-xl font-bold text-mdn-green sm:text-2xl">{s.value}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-mdn-gray sm:text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Milestone timeline */}
        <div className="mt-14 text-left">
          <div className="relative border-l border-mdn-green/25 pl-6 sm:pl-8">
            {MILESTONES.map((m, i) => (
              <div key={m.year} className={`relative pb-8 last:pb-0 ${i === 0 ? "" : ""}`}>
                <span className="absolute -left-[29px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-mdn-green bg-mdn-charcoal sm:-left-[33px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-mdn-green" />
                </span>
                <p className="text-xs font-bold uppercase tracking-widest text-mdn-green">{m.year}</p>
                <p className="mt-1 text-sm leading-relaxed text-mdn-gray sm:text-base">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
