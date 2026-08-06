import { useState } from "react";
import Reveal from "./motion/Reveal";
import MaskReveal from "./motion/MaskReveal";

const SHORT_STORY =
  "MDN was founded by Deepak Saini — a professional bodybuilder, fitness trainer, and nutrition coach whose bodybuilding journey began in 2001. A five-time Mr. Delhi and Mr. North Delhi title holder, he built MDN so his students could rely on one authentic, high-quality source for their nutrition.";

const FULL_STORY =
  "MY DAILY NUTRITION (MDN) was founded by Deepak Saini, a professional bodybuilder, fitness trainer, and nutrition coach whose bodybuilding journey began in 2001. Years of dedication, discipline, and continuous learning turned his passion into a career — earning him the title of Mr. Delhi five times and Mr. North Delhi once, achievements built on consistent hard work, disciplined living, proper training, and balanced nutrition. Inspired by his own journey, Deepak dedicated himself to helping others reach their fitness goals, guiding countless students toward the right physique for their body type and objectives, and always emphasizing proper nutrition alongside the right supplements. As his students grew to trust his guidance, many encouraged him to launch his own supplement brand so they could access reliable, authentic, and high-quality products from a single trusted source — and in July 2019, MY DAILY NUTRITION (MDN) was born. Today MDN offers a diverse portfolio of 37 nutritional supplements, carefully formulated to support bodybuilding, sports performance, general fitness, and overall wellness, serving customers from 10-year-old children to 80-year-old adults. Our mission is simple: to deliver trusted, high-quality nutrition that empowers people to achieve their fitness, performance, and wellness goals with confidence.";

const STATS = [
  { value: "2001", label: "Bodybuilding Since" },
  { value: "5x", label: "Mr. Delhi Titles" },
  { value: "2019", label: "MDN Founded" },
  { value: "37", label: "Nutritional Supplements" },
];

const MILESTONES = [
  { year: "2001", text: "Deepak Saini begins his bodybuilding journey." },
  { year: "Titles", text: "Crowned Mr. Delhi five times and Mr. North Delhi once." },
  { year: "Coaching", text: "Becomes a trainer & nutrition coach, guiding countless students." },
  { year: "July 2019", text: "Launches MY DAILY NUTRITION (MDN)." },
  { year: "Today", text: "37 supplements trusted by customers aged 10 to 80." },
];

export default function StorySection() {
  const [expanded, setExpanded] = useState(false);

  return (
    // py-14/16 matches every other home section. This was py-20/28
    // (112px top AND bottom at sm+), 48px more than its neighbours on
    // each side — and because the band sits between two sections that
    // each add their own 64px, the seams either side read as large empty
    // gaps rather than section rhythm.
    <section id="story" className="relative overflow-hidden border-y border-white/5 bg-mdn-charcoal py-14 sm:py-16">
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

      {/* Two-column at lg: the narrative reads down the left, the
          milestone timeline sits beside it on the right, and the stats
          band spans the full width underneath. Previously all three
          stacked inside a single centred max-w-3xl (768px) column, which
          on a wide screen left ~575px of dead space on each side and made
          the left-aligned timeline read as a thin strip hugging the
          middle. The prose keeps its own max-w-xl reading measure so
          widening the section doesn't stretch lines to an awkward length. */}
      <div className="relative mx-auto max-w-shell px-4 sm:px-6 lg:px-[34px]">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          {/* Left — narrative. Enters from the left since it sits in the
              left column — see the right column below, which mirrors it. */}
          <Reveal from="left" className="text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-mdn-green">
              Our Journey
            </p>
            <MaskReveal
              as="h2"
              className="mt-3 text-3xl font-bold text-mdn-white sm:text-4xl lg:text-5xl"
              lines={[
                <>
                  The Story of <span className="text-mdn-green">MDN</span>
                </>,
              ]}
            />

            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-mdn-gray sm:text-base lg:mx-0">
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
            <blockquote className="mx-auto mt-10 max-w-xl border-l-2 border-mdn-green/50 pl-5 text-left text-base font-semibold italic leading-relaxed text-mdn-white/90 sm:text-lg lg:mx-0">
              "Our mission is simple: to deliver trusted, high-quality nutrition that empowers people to achieve their fitness, performance, and wellness goals with confidence."
            </blockquote>
          </Reveal>

          {/* Right — milestone timeline. Enters from the right, mirroring
              the left column, instead of reusing the same direction. */}
          <Reveal from="right" className="text-left">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-mdn-green lg:text-left">
              Milestones
            </p>
            <div className="relative mt-6 border-l border-mdn-green/25 pl-6 sm:pl-8">
              {MILESTONES.map((m, i) => (
                <Reveal key={m.year} from="up" delay={i * 0.1} amount={0.4} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[29px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-mdn-green bg-mdn-charcoal sm:-left-[33px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-mdn-green" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-widest text-mdn-green">{m.year}</p>
                  <p className="mt-1 text-sm leading-relaxed text-mdn-gray sm:text-base">{m.text}</p>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Stats band — full shell width, so the four cards sit as a
            proper row rather than four small tiles in a narrow column. */}
        <div className="mt-14 grid grid-cols-2 gap-4 text-center sm:grid-cols-4 lg:mt-16 lg:gap-6">
          {STATS.map((s, i) => (
            <Reveal
              key={s.label}
              from="up"
              delay={i * 0.1}
              amount={0.4}
              className="rounded-xl border border-mdn-green/20 bg-mdn-charcoal2 px-3 py-5 transition-transform duration-300 hover:-translate-y-1 lg:py-7"
            >
              <p className="font-display text-xl font-bold text-mdn-green sm:text-2xl lg:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-mdn-gray sm:text-xs lg:text-sm">
                {s.label}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
