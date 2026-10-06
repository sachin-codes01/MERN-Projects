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

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// Naam ke pehle letters se avatar (e.g. "Rohit S." -> "RS")
const initials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const ReviewsSection = () => {
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
    <section className="band-soft ambient w-full">
      <div className="section">
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
          className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:mt-6 sm:flex-wrap sm:justify-center sm:px-0"
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
          className="relative mt-2 overflow-hidden sm:mt-4"
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
              className="flex items-stretch py-4 transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {slides.map((group, si) => (
                <div key={si} className="grid w-full shrink-0 items-stretch gap-4 px-1 sm:grid-cols-3">
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
                      className="lift flex h-full cursor-default flex-col rounded-xl border border-mdn-border bg-mdn-charcoal p-5 shadow-xs sm:p-6"
                    >
                      <div
                        className="flex gap-0.5 text-mdn-star"
                        role="img"
                        aria-label={`${r.rating} out of 5 stars`}
                      >
                        {Array.from({ length: 5 }).map((_, s) => (
                          <svg
                            key={s}
                            width="16"
                            height="16"
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

                      {/* flex-1: naam wala block har card me bottom pe hi rahe */}
                      <p className="mt-3 flex-1 text-[15px] leading-relaxed text-mdn-ink-body sm:text-base">
                        &ldquo;{r.quote}&rdquo;
                      </p>

                      <span className="mt-3 inline-flex w-fit rounded-md bg-mdn-sand px-2 py-0.5 text-xs font-medium text-mdn-ink-muted">
                        {r.tag}
                      </span>

                      <footer className="mt-4 flex items-center gap-2.5 border-t border-mdn-border pt-3">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-mdn-green text-[13px] font-bold text-mdn-on-primary">
                          {initials(r.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-heading text-[15px] font-semibold text-mdn-ink">{r.name}</p>
                          <p className="text-xs text-mdn-ink-muted">{r.role}</p>
                        </div>
                      </footer>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Reveal>

        {slides.length > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  stopAutoplay();
                  setIndex(i);
                }}
                aria-label={`Go to review slide ${i + 1}`}
                className={`tap-44 h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-mdn-orange-solid" : "w-2 bg-mdn-border-strong hover:bg-mdn-ink-muted"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
