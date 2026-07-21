import { useCallback, useEffect, useRef, useState } from "react";

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
  const slides = chunk(filtered, 3);

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
  }, [activeTag]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay]);

  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-mdn-charcoal py-16">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full bg-mdn-green/10 blur-[100px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--mdn-white)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--mdn-white)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            <span className="hidden h-px w-14 shrink-0 bg-mdn-green sm:block" />
            <h2 className="text-3xl font-bold leading-tight text-mdn-white sm:text-4xl">
              Real People, <span className="text-mdn-green">Real Stories</span>
            </h2>
            <span className="hidden h-px w-14 shrink-0 bg-mdn-green sm:block" />
          </div>
          <p className="mt-2 text-sm text-mdn-gray sm:text-base">
            Over 2,00,000+ athletes trust MDN (and counting)
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                stopAutoplay();
                setActiveTag(tag);
              }}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors duration-200 ${
                activeTag === tag
                  ? "border-mdn-green bg-mdn-green text-mdn-black"
                  : "border-white/10 text-mdn-gray hover:border-mdn-green/40 hover:text-mdn-white"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Pauses on hover, like the other carousels on the page. */}
        <div
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
                <div key={si} className="grid w-full shrink-0 items-center gap-5 px-1 sm:grid-cols-3 sm:gap-6">
                  {group.map((r, i) => {
                    // Middle card in each row of 3 is emphasized — larger,
                    // lifted, glowing — matching the "zoomed center card"
                    // look from the reference screenshot.
                    const isCenter = i === 1 && group.length === 3;
                    return (
                      <div
                        key={i}
                        className={`card-alt flex h-full cursor-default flex-col p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-mdn-green/40 hover:shadow-green-glow sm:p-7 ${
                          isCenter
                            ? "sm:z-10 sm:scale-110 sm:border-mdn-green/40 sm:shadow-green-glow"
                            : "sm:scale-95 sm:opacity-90 hover:sm:scale-100 hover:sm:opacity-100"
                        }`}
                      >
                        <div className="flex gap-0.5 text-mdn-green">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s < r.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                              <path d="M12 2l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6 5.8 20.7l1.6-6.9L2.1 9.1l7-.7L12 2z" />
                            </svg>
                          ))}
                        </div>
                        <p className="mt-4 text-base leading-relaxed text-mdn-white/90">&ldquo;{r.quote}&rdquo;</p>
                        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-mdn-white">{r.name}</p>
                        <p className="text-sm text-mdn-gray">{r.role}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

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
                className={`h-2 rounded-full transition-all duration-300 ${
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
