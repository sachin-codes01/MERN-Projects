import { useState } from "react";

const FAQS = [
  { q: "Is MDN Whey Protein Isolate suitable for beginners?", a: "Yes. Isolate is gentler on digestion than concentrate and works well whether you're just starting out or training at an advanced level." },
  { q: "How many scoops should I take per day?", a: "Most people do 1 scoop (26g protein) post-workout, and a second scoop if their daily protein target isn't met through food alone." },
  { q: "Does it contain added sugar?", a: "No — our Isolate line is formulated with 0g sugar per serving." },
  { q: "How long does delivery take?", a: "Orders are typically dispatched within 24–48 hours and delivered in 3–6 business days depending on your location." },
  { q: "What's your return policy?", a: "Unopened products can be returned within 7 days of delivery. Reach out to support and we'll sort out a replacement or refund." },
];

export default function FAQ() {
  const [open, setOpen] = useState(-1);

  return (
    <section id="faq" className="mx-auto max-w-shell px-4 py-14 sm:px-6 lg:px-[34px] sm:py-16">
      {/* Flat editorial list — heading flush top-left, one full-width
          column, a hairline rule under every row, and a +/− on the right.
          No card, no border box, no fill. */}
      <h2 className="font-display text-3xl font-bold text-mdn-white sm:text-4xl lg:text-5xl">FAQs</h2>

      <div className="mt-8 sm:mt-10">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="border-b border-white/10">
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="group flex w-full items-center justify-between gap-6 py-5 text-left sm:py-6"
              >
                <span className="text-base font-bold leading-snug text-mdn-white transition-colors duration-200 group-hover:text-mdn-green sm:text-lg">
                  {item.q}
                </span>

                {/* Two bars: the vertical one collapses to nothing when the
                    row opens, turning the + into a −. Cheaper and steadier
                    than rotating a chevron, and it matches the flat look. */}
                <span className="relative h-5 w-5 flex-shrink-0 text-mdn-white transition-colors duration-200 group-hover:text-mdn-green">
                  <span className="absolute left-0 top-1/2 h-[1.5px] w-5 -translate-y-1/2 bg-current" />
                  <span
                    className={`absolute left-1/2 top-0 h-5 w-[1.5px] -translate-x-1/2 bg-current transition-transform duration-300 ${
                      isOpen ? "scale-y-0" : "scale-y-100"
                    }`}
                  />
                </span>
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  {/* The rule spans the whole column, but the answer keeps a
                      reading measure — a very long line of body copy is
                      uncomfortable to track back from. */}
                  <p className="max-w-3xl pb-5 pr-10 text-sm leading-relaxed text-mdn-gray sm:pb-6 sm:text-base">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
