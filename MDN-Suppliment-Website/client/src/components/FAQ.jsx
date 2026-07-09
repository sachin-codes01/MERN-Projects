import { useState } from "react";

const FAQS = [
  { q: "Is MDN Whey Protein Isolate suitable for beginners?", a: "Yes. Isolate is gentler on digestion than concentrate and works well whether you're just starting out or training at an advanced level." },
  { q: "How many scoops should I take per day?", a: "Most people do 1 scoop (26g protein) post-workout, and a second scoop if their daily protein target isn't met through food alone." },
  { q: "Does it contain added sugar?", a: "No — our Isolate line is formulated with 0g sugar per serving." },
  { q: "How long does delivery take?", a: "Orders are typically dispatched within 24–48 hours and delivered in 3–6 business days depending on your location." },
  { q: "What's your return policy?", a: "Unopened products can be returned within 7 days of delivery. Reach out to support and we'll sort out a replacement or refund." },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h2 className="text-center text-2xl font-bold text-mdn-white sm:text-3xl">
        Frequently Asked <span className="text-mdn-green">Questions</span>
      </h2>

      <div className="mt-8 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="bg-mdn-charcoal">
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5"
              >
                <span className="text-sm font-medium text-mdn-white sm:text-base">{item.q}</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`flex-shrink-0 text-mdn-green transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm leading-relaxed text-mdn-gray">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}