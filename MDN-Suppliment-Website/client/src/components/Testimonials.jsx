import { useEffect, useRef, useState } from "react";

const TESTIMONIALS = [
  { name: "Rohit S.", role: "Powerlifter", quote: "Mixes clean, no clumping, and the flavor actually tastes like something. My go-to isolate for 8 months now.", rating: 5 },
  { name: "Ayesha K.", role: "CrossFit Coach", quote: "Zero bloating compared to other whey I've tried. Ordering process was smooth and delivery was quick.", rating: 5 },
  { name: "Vikram M.", role: "Bodybuilder", quote: "26g protein per scoop and it shows in recovery time. The malai kulfi flavor is genuinely great.", rating: 4 },
  { name: "Neha P.", role: "Marathon Runner", quote: "Low sugar, high protein — exactly what I needed post-run. Customer support helped me pick the right variant.", rating: 5 },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, []);

  const goTo = (i) => {
    clearInterval(timerRef.current);
    setIndex(i);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h2 className="text-center text-2xl font-bold text-mdn-white sm:text-3xl">
        What Our <span className="text-mdn-green">Athletes</span> Say
      </h2>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-mdn-gray">
        Real feedback from real training — no scripted reviews.
      </p>

      <div className="relative mt-10 overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="w-full flex-shrink-0 px-2">
              <div className="card mx-auto max-w-xl px-6 py-8 text-center sm:px-10">
                <div className="mb-3 flex justify-center gap-1 text-mdn-green">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s < t.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6 5.8 20.7l1.6-6.9L2.1 9.1l7-.7L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-mdn-white/90 sm:text-base">"{t.quote}"</p>
                <p className="mt-4 font-semibold text-mdn-white">{t.name}</p>
                <p className="text-xs uppercase tracking-wide text-mdn-gray">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to testimonial ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-mdn-green" : "w-2 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}