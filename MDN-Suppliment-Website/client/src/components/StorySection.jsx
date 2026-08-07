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

/**
 * The founder narrative.
 *
 * This section was the last part of the home page still written for the
 * old dark theme, and it showed: a green blur-blob, a 48px grid mesh and
 * two floating ring outlines behind the copy. Those are lighting effects
 * — they work by being brighter than the page. On a near-white ground
 * there is nothing for them to be brighter than, so the blob rendered as
 * a faint olive smudge and the mesh as dirt. All three are gone rather
 * than re-tinted: this is the one section on the page that is pure
 * reading, and the right background for reading is paper.
 *
 * What carries it instead is typographic contrast — the founder's story
 * set as an article, the milestones as a ruled sidebar, and the numbers
 * as a hairline-divided ledger.
 */
export default function StorySection() {
  const [expanded, setExpanded] = useState(false);

  return (
    /* Warm white, one step ABOVE the page's sand ground. The band either
       side of it (Shop by Collection above, the trust strip below) sits
       on the page ground, so lifting this one is what separates the three
       without needing a border — which is why the old `border-white/5`
       hairlines are gone too. */
    <section id="story" className="w-full bg-mdn-charcoal py-10 sm:py-12 lg:py-14">
      <div className="mx-auto max-w-shell px-4 sm:px-6 lg:px-[34px]">
        {/* Flush left, deliberately — this is the ONE section on the home
            page whose heading is not centred (see SectionHeading, which
            every other section uses). It earns the exception by being the
            only section that is long-form reading rather than a rack of
            cards: the article, the timeline and the ledger below all hang
            off a hard left edge, and a centred masthead over them would
            float free of the column it introduces. */}
        <div className="flex items-center gap-3 sm:gap-4">
          <span aria-hidden="true" className="section-index shrink-0">02</span>
          <span className="eyebrow shrink-0">Our Journey</span>
          <span aria-hidden="true" className="section-rule flex-1" />
        </div>

        <MaskReveal
          as="h2"
          className="display-lg mt-3.5"
          lines={[
            <>
              The Story of <span className="display-accent">MDN</span>
            </>,
          ]}
        />

        {/* 1.1fr : 0.9fr, not 1:1. The left column holds running prose and
            the right holds five short timeline entries, so an even split
            would give the narrative too narrow a measure while leaving the
            sidebar half empty. */}
        <div className="mt-7 grid gap-8 lg:mt-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {/* --- Left: the article --- */}
          <Reveal from="left">
            {/* Dropped WORD, not a dropped initial. The paragraph opens
                on the brand name, so setting the whole of "MDN" large is
                what an initial cap is actually for here — a single big
                "M" followed by a normal-size "DN" reads as a typo, since
                it splits an acronym rather than a word.

                Three letters is a lot of width to float, so the display
                size is held lower than a one-letter cap would be: the
                first two lines still wrap beside it instead of one long
                line clearing it.

                `mt` + tight leading optically seat it on the first line's
                cap-height. Didot's ascenders overshoot, so aligning the
                boxes leaves the word sitting visibly high. */}
            <p className="text-[15px] leading-[1.75] text-mdn-ink-body sm:text-base">
              {!expanded && (
                /* NOT aria-hidden. This span holds the paragraph's real
                   first word — the copy below is sliced so "MDN" is not
                   set twice — so hiding it would leave a screen reader
                   announcing "was founded by Deepak Saini" with no
                   subject. Because it is an ordinary inline span, the
                   accessible reading order is already correct: "MDN" then
                   " was founded by…". */
                <span className="float-left mr-3 mt-[0.1em] font-serif text-[2.6rem] font-normal leading-[0.85] tracking-tight text-mdn-ink sm:text-[3rem]">
                  MDN
                </span>
              )}
              {/* `slice(3)` drops the literal "MDN" the span above now
                  carries. The expanded copy opens differently ("MY DAILY
                  NUTRITION (MDN) was founded…") and is never sliced. */}
              {expanded ? FULL_STORY : SHORT_STORY.slice(3)}
            </p>

            <button
              onClick={() => setExpanded((e) => !e)}
              /* Underline-on-rest, not a coloured link: the accent colour
                 is spoken for by prices and CTAs, and a green text link
                 here would read as a third action level. */
              className="tap-44 group mt-5 inline-flex items-center gap-1.5 border-b border-mdn-ink/30 pb-0.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-mdn-ink transition-colors duration-200 hover:border-mdn-orange hover:text-mdn-orange"
            >
              {expanded ? "Read less" : "Read the full story"}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                aria-hidden="true"
                className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Pull quote, set in the display face. A didone italic at
                this size is the strongest typographic move available on
                the page and this is the one line worth spending it on —
                so it is NOT repeated anywhere else in the section. */}
            <blockquote className="mt-7 border-l-2 border-mdn-orange/60 pl-5">
              <p className="font-serif text-[17px] italic leading-[1.45] text-mdn-ink sm:text-lg">
                Our mission is simple: to deliver trusted, high-quality nutrition that empowers
                people to achieve their fitness, performance, and wellness goals with confidence.
              </p>
              <cite className="label mt-3 block text-[10px] not-italic text-mdn-ink-muted">
                Deepak Saini · Founder
              </cite>
            </blockquote>
          </Reveal>

          {/* --- Right: the timeline --- */}
          <Reveal from="right">
            <p className="label text-[10px] text-mdn-ink-muted">Milestones</p>

            {/* The spine is a border on the <ol>, and each marker is
                pulled back onto it with a negative offset. Markers are
                hollow ink rings rather than filled green dots: five solid
                accent dots down a column would out-shout the section
                heading above them. */}
            <ol className="relative mt-5 border-l border-mdn-border-strong">
              {MILESTONES.map((m, i) => (
                <Reveal
                  as="li"
                  key={m.year}
                  from="up"
                  delay={i * 0.09}
                  amount={0.4}
                  className="relative pb-6 pl-6 last:pb-0 sm:pl-7"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-[5.5px] top-[0.45em] block h-[11px] w-[11px] rounded-full border-2 border-mdn-ink bg-mdn-charcoal"
                  />
                  <p className="label text-[10px] text-mdn-orange-ink">{m.year}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-mdn-ink-body sm:text-[15px]">
                    {m.text}
                  </p>
                </Reveal>
              ))}
            </ol>
          </Reveal>
        </div>

        {/* --- Numbers, as a ledger --- */}
        {/* Four hairline-divided cells, not four bordered cards. At this
            size a card is pure packaging: it adds a border, a radius, a
            fill and a shadow around two lines of text, and four of them
            in a row reads as a widget bar. Dividing rules carry the same
            grouping with none of the furniture, which is also what lets
            the numbers themselves be set large enough to matter. */}
        {/* Divided by vertical rules only, with no outer border and no
            per-cell padding block — the cells sit directly under the two
            columns above rather than being pushed down by a top rule and
            a tall pad on every side, which is where most of this
            section's dead space was coming from. */}
        <div className="mt-9 grid grid-cols-2 gap-y-6 border-t border-mdn-border-strong pt-7 sm:grid-cols-4 sm:gap-y-0 lg:mt-11">
          {STATS.map((s, i) => (
            <Reveal
              key={s.label}
              from="up"
              delay={i * 0.08}
              amount={0.4}
              /* Vertical rule between cells, suppressed on the last of
                 each row. The row length changes at `sm` (two per row
                 below it, four above), so the odd-index rule is dropped
                 once the row widens. */
              /* The left padding is zeroed on whichever cell STARTS a
                 row, not just on the first cell overall. The row length
                 changes at `sm` — two per row below it, four above — so
                 below `sm` that is every odd child (cells 1 and 3), and
                 above it only the first. Without the odd-child rule the
                 second row's numbers sat 16px right of the first row's
                 and the ledger lost its left edge. */
              className={`px-4 [&:nth-child(odd)]:pl-0 sm:px-6 sm:[&:nth-child(odd)]:pl-6 sm:first:pl-0 ${
                (i + 1) % 2 === 0 ? "sm:border-r" : "border-r"
              } ${i === STATS.length - 1 ? "border-r-0 sm:border-r-0" : ""} border-mdn-border-strong`}
            >
              {/* Didot at 400. No `font-bold` — the display face has one
                  weight and a bold utility would make the browser fake
                  it (see the synthetic-bold guard in index.css). */}
              <p className="font-display text-[2rem] leading-none text-mdn-ink sm:text-[2.5rem]">
                {s.value}
              </p>
              <p className="label mt-2 text-[10px] leading-tight text-mdn-ink-muted">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
