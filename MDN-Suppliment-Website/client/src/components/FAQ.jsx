import { useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "./motion/Reveal";
import SectionHeading from "./SectionHeading";

const FAQS = [
  { q: "Is MDN Whey Protein Isolate suitable for beginners?", a: "Yes. Isolate is gentler on digestion than concentrate and works well whether you're just starting out or training at an advanced level." },
  { q: "How many scoops should I take per day?", a: "Most people do 1 scoop (26g protein) post-workout, and a second scoop if their daily protein target isn't met through food alone." },
  { q: "Does it contain added sugar?", a: "No — our Isolate line is formulated with 0g sugar per serving." },
  { q: "How long does delivery take?", a: "Orders are typically dispatched within 24–48 hours and delivered in 3–6 business days depending on your location." },
  { q: "What's your return policy?", a: "Unopened products can be returned within 7 days of delivery. Reach out to support and we'll sort out a replacement or refund." },
];

// Reference ka "Help Centre" layout: left me heading + "Still have a question?"
// card, right me bordered accordion cards. Mobile pe sab ek column me.
const FAQ = () => {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="section">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:gap-12">
        <div className="lg:sticky lg:top-36 lg:self-start">
          <SectionHeading
            align="left"
            eyebrow="Help centre"
            title="FAQs"
            subtitle="Quick answers about our products, orders and delivery"
          />
          <StillHaveQuestion className="mt-6 hidden lg:flex" />
        </div>

        <div className="flex flex-col gap-2.5">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;
            return (
              <Reveal
                key={i}
                as="div"
                from="up"
                amount={0.4}
                delay={i * 0.06}
                className={`rounded-xl border bg-mdn-charcoal transition-[border-color,box-shadow] duration-300 hover:border-mdn-border-strong ${
                  isOpen ? "border-mdn-border-strong shadow-xs" : "border-mdn-border"
                }`}
              >
                <button
                  id={buttonId}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="group flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-6 sm:py-5"
                >
                  <span className="font-heading text-[15px] font-semibold leading-snug text-mdn-ink sm:text-[17px]">
                    {item.q}
                  </span>

                  {/* Gol +/− button — khulne pe vertical bar gayab ho jata hai */}
                  <span
                    aria-hidden="true"
                    className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-300 ${
                      isOpen ? "rotate-180 bg-mdn-ink text-mdn-charcoal" : "bg-mdn-sand text-mdn-ink group-hover:bg-mdn-green-soft"
                    }`}
                  >
                    <span className="absolute h-[1.5px] w-3 bg-current" />
                    <span
                      className={`absolute h-3 w-[1.5px] bg-current transition-transform duration-300 ${
                        isOpen ? "scale-y-0" : "scale-y-100"
                      }`}
                    />
                  </span>
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  // Band panel screen reader / Tab se bahar rahe
                  inert={!isOpen}
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p
                      className={`border-t border-mdn-border px-4 pb-4 pt-3 text-[14px] leading-relaxed text-mdn-ink-body transition-[opacity,transform] duration-300 sm:px-6 sm:pb-5 sm:text-[15px] ${
                        isOpen ? "translate-y-0 opacity-100 delay-100" : "-translate-y-1 opacity-0"
                      }`}
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <StillHaveQuestion className="flex lg:hidden" />
      </div>
    </section>
  );
};

// Dark "Still have a question? — Chat now" card → Customer Support page
const StillHaveQuestion = ({ className = "" }) => (
  <div className={`items-center justify-between gap-4 rounded-xl bg-mdn-green-dark p-4 ring-1 ring-inset ring-white/10 sm:p-5 ${className}`}>
    <div className="min-w-0">
      <p className="font-heading text-base font-semibold text-white">Still have a question?</p>
      <p className="mt-0.5 text-[13px] text-white/75">Our support team is happy to help</p>
    </div>
    <Link
      to="/support"
      className="btn-shine press flex-shrink-0 rounded-full bg-white px-5 py-2.5 font-heading text-sm font-semibold text-[#241f1a] transition-colors duration-200 hover:bg-mdn-orange-solid hover:text-white"
    >
      Chat now
    </Link>
  </div>
);

export default FAQ;
