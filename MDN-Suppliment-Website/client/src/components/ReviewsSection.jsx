import { useCallback, useEffect, useRef, useState } from "react";
import SectionHeading from "./SectionHeading";
import Reveal from "./motion/Reveal";
import { useMediaQuery } from "../hooks/useMediaQuery";

const TAGS = ["All", "Muscle", "Taste", "Growth", "Recovery", "Fat Loss", "Digestion"];

const REVIEWS = [
  { name: "Rohit S.", role: "Powerlifter", rating: 5, tag: "Muscle", quote: "Recovery time dropped noticeably within three weeks of daily use." },
  { name: "Ayesha K.", role: "CrossFit Coach", rating: 5, tag: "Digestion", quote: "Zero bloating compared to every other whey I've tried before this." },
  { name: "Vikram M.", role: "Bodybuilder", rating: 4, tag: "Taste", quote: "Malai kulfi flavor is genuinely great, doesn't taste like a supplement." },
  { name: "Neha P.", role: "Marathon Runner", rating: 5, tag: "Recovery", quote: "Low sugar, high protein — exactly what I needed post-run recovery." },
  { name: "Arjun T.", role: "Gym Regular", rating: 5, tag: "Muscle", quote: "Mixes smooth, no chalky aftertaste, and I've become a repeat customer." },
  { name: "Sana R.", role: "Amateur Athlete", rating: 4, tag: "Growth", quote: "Great value for the protein content per scoop, visible strength gains." },
  { name: "Kabir D.", role: "Trainer", rating: 5, tag: "Recovery", quote: "Three months in, the difference in recovery between sessions is real." },
  { name: "Priya N.", role: "Home Lifter", rating: 5, tag: "Fat Loss", quote: "Iso Lean helped me cut without losing strength on heavy lift days." },
  { name: "Dev S.", role: "College Athlete", rating: 4, tag: "Growth", quote: "Steady lean gains over two months, nothing bloated or watery." },
];

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function ReviewsSection() {
  const [activeTag, setActiveTag] = useState("All");
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  const filtered = activeTag === "All" ? REVIEWS : REVIEWS.filter((r) => r.tag === activeTag);

  // One testimonial per slide on phones, three on sm+. The chunk size was
  // fixed at 3, and below `sm` the grid inside each slide collapses to a
  // single column — so all three cards of a slide simply stacked and were
  // on screen together, which defeats the point of a carousel. Chunking by
  // viewport is what makes a small screen actually show one at a time.
  const isWide = useMediaQuery("(min-width: 640px)");
  const perSlide = isWide ? 3 : 1;
  const slides = chunk(filtered, perSlide);

  const stopAutoplay = () => clearInterval(timerRef.current);
  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (slides.length > 1) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % slides.length);
      }, 4500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  useEffect(() => {
    setIndex(0);
  }, [activeTag, perSlide]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay]);

  return (
    /* Sand band, no decoration. The blur-blob and 48px grid mesh that
       used to sit behind this section were dark-theme lighting effects —
       they work by being brighter than the page, and on cream there is
       nothing for them to be brighter than, so they rendered as an olive
       smudge and a layer of dirt. A tinted band separates this section
       from its neighbours on its own. */
    <section className="w-full bg-mdn-sand py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-shell px-4 sm:px-6 lg:px-[34px]">
        <SectionHeading
          index="07"
          eyebrow="Testimonials"
          title="Real People,"
          accent="Real Stories"
          subtitle="Over 2,00,000+ athletes trust MDN (and counting)"
        />

        {/* Filter row. `.chip` / `.chip-active` are shared classes now
            (see index.css) rather than green fills hand-rolled here, so
            this row matches every other filter row on the site. */}
        <div
          role="group"
          aria-label="Filter reviews by topic"
          className="mt-9 flex flex-wrap justify-center gap-2"
        >
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                stopAutoplay();
                setActiveTag(tag);
              }}
              aria-pressed={activeTag === tag}
              className={`chip ${
                activeTag === tag ? "chip-active" : "hover:border-mdn-ink/40 hover:text-mdn-ink"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Pauses on hover, like the other carousels on the page. */}
        {/* Block reveal, not per-card. Every slide is rendered in one
            long flex row that is moved with translateX inside this
            `overflow-hidden` box, so slides 2 and 3 are off to the side
            and never intersect the viewport — a per-card `whileInView`
            with `once: true` would leave two thirds of the testimonials
            permanently at opacity 0, including after the carousel
            advanced to them. */}
        <Reveal
          from="up"
          amount={0.15}
          className="relative mt-8 overflow-hidden"
          onMouseEnter={stopAutoplay}
          onMouseLeave={startAutoplay}
        >
          {slides.length === 0 ? (
            <p className="py-8 text-center text-sm text-mdn-gray">No reviews for this tag yet.</p>
          ) : (
            <div
              // py-4 (and px-1 on the group below) give the scaled/lifted
              // center card room to grow into without its top/bottom/side
              // edges getting cut off by this wrapper's overflow-hidden —
              // that clipping was the bug in the screenshot.
              className="flex items-center py-5 transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {slides.map((group, si) => (
                <div key={si} className="grid w-full shrink-0 items-stretch gap-5 px-1 sm:grid-cols-3 sm:gap-6">
                  {group.map((r, i) => (
                    /* Every card is the same size now. The middle one used
                       to be scaled to 110% and its neighbours to 95%,
                       which meant the same 16px type rendered at three
                       different sizes across one row — the two scaled
                       cards resampled their text rather than re-laying it
                       out, so it read soft next to the unscaled one. The
                       emphasis is gone; a testimonial row does not need a
                       hero item, and equal cards let the reader compare
                       them, which is what testimonials are for. */
                    <article
                      key={i}
                      className="group relative flex h-full cursor-default flex-col overflow-hidden rounded-lg border border-mdn-border bg-mdn-charcoal p-6 shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-7"
                    >
                      {/* Didot quotation mark as a watermark. Held very
                          low in contrast and clipped by the card's own
                          overflow, so it reads as a texture in the corner
                          rather than a glyph competing with the copy. */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-2 -top-8 select-none font-serif text-[7rem] leading-none text-mdn-ink/[0.045] transition-colors duration-300 group-hover:text-mdn-ink/[0.07]"
                      >
                        &rdquo;
                      </span>

                      {/* Gold, not green. Stars are a rating convention
                          with a colour the whole web already agrees on,
                          and `--star` exists in the token set precisely
                          for this — green stars read as a brand flourish
                          and stop communicating a score. */}
                      <div
                        className="relative flex gap-0.5 text-mdn-star"
                        role="img"
                        aria-label={`${r.rating} out of 5 stars`}
                      >
                        {Array.from({ length: 5 }).map((_, s) => (
                          <svg
                            key={s}
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            fill={s < r.rating ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M12 2l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6 5.8 20.7l1.6-6.9L2.1 9.1l7-.7L12 2z" />
                          </svg>
                        ))}
                      </div>

                      {/* `flex-1` so the attribution block below is pushed
                          to the bottom of every card regardless of quote
                          length — otherwise names sit at a different
                          height in each card of the row. */}
                      <p className="relative mt-5 flex-1 text-[15px] leading-[1.65] text-mdn-ink-body">
                        {r.quote}
                      </p>

                      {/* Attribution, separated by a rule rather than by
                          whitespace alone, so it reads as a signature
                          block under the quote instead of a third
                          paragraph. */}
                      <footer className="relative mt-6 border-t border-mdn-border pt-4">
                        <p className="label text-[11px] text-mdn-ink">{r.name}</p>
                        <p className="mt-1 text-[12px] text-mdn-ink-muted">{r.role}</p>
                      </footer>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Reveal>

        {slides.length > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  stopAutoplay();
                  setIndex(i);
                }}
                aria-label={`Go to review slide ${i + 1}`}
                className={`tap-44 h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-mdn-green" : "w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
