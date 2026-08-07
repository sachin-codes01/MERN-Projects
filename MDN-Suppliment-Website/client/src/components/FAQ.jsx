import { useState } from "react";
import Reveal from "./motion/Reveal";
import MaskReveal from "./motion/MaskReveal";

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
    <section id="faq" className="mx-auto max-w-shell px-4 py-8 sm:px-6 sm:py-10 lg:px-[34px]">
      {/* Flat editorial list — heading flush top-left, one full-width
          column, a hairline rule under every row, and a +/− on the right.
          No card, no border box, no fill.

          Deliberately NOT the centred SectionHeading the rest of the page
          uses: this is the page's closing utility block, and a one-word
          title over a full-width list of rows reads as a label for the
          list rather than as another section masthead. */}
      {/* Spelled out rather than the "FAQs" abbreviation. The acronym is
          four characters of lowercase-plus-caps in a face built for
          display sizes — it gave Didot nothing to do and read as a label,
          not a heading. The full phrase also lets the closing word take
          the italic accent every other section title on the page uses. */}
      <MaskReveal
        as="h2"
        className="display-lg"
        lines={[
          <>
            Frequently Asked <span className="display-accent">Questions</span>
          </>,
        ]}
      />

      {/* A top rule as well as one per row, so the list reads as a closed
          block rather than a heading followed by four floating lines. */}
      <div className="mt-8 border-t border-mdn-border sm:mt-10">
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
              delay={i * 0.08}
              /* The rule under an OPEN row steps up to `border-strong`,
                 which is the only structural cue that the answer below
                 belongs to the question above it — without it, an
                 expanded row and its neighbour are separated by
                 identical hairlines and the block reads as one run of
                 text. */
              className={`border-b transition-colors duration-300 ${
                isOpen ? "border-mdn-border-strong" : "border-mdn-border"
              }`}
            >
              <button
                id={buttonId}
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="group flex w-full items-center justify-between gap-6 py-5 text-left sm:py-6"
              >
                {/* font-body, not the inherited Didot: these are UI rows
                    at 16-18px, where a didone's hairlines go thin and
                    fussy. The display face is spent on the heading above.

                    The open row holds the green at rest rather than only
                    on hover, so which question is expanded is still
                    legible once the pointer has moved away — on touch,
                    where there is no hover at all, that was previously
                    the ONLY colour cue and it never appeared. */}
                <span
                  className={`font-body text-base font-bold leading-snug transition-colors duration-200 group-hover:text-mdn-green sm:text-lg ${
                    isOpen ? "text-mdn-green" : "text-mdn-ink"
                  }`}
                >
                  {item.q}
                </span>

                {/* Two bars: the vertical one collapses to nothing when the
                    row opens, turning the + into a −. Cheaper and steadier
                    than rotating a chevron, and it matches the flat look.

                    The whole mark also rotates a quarter turn as it
                    collapses. Scaling the bar alone reads as the mark
                    breaking; rotating through it reads as one shape
                    turning, and it lands the horizontal bar in exactly
                    the same place either way so nothing appears to jump. */}
                <span
                  aria-hidden="true"
                  className={`relative h-5 w-5 flex-shrink-0 transition-[color,transform] duration-300 group-hover:text-mdn-green ${
                    isOpen ? "rotate-90 text-mdn-green" : "text-mdn-ink"
                  }`}
                >
                  <span className="absolute left-0 top-1/2 h-[1.5px] w-5 -translate-y-1/2 bg-current" />
                  <span
                    className={`absolute left-1/2 top-0 h-5 w-[1.5px] -translate-x-1/2 bg-current transition-transform duration-300 ${
                      isOpen ? "scale-y-0" : "scale-y-100"
                    }`}
                  />
                </span>
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                /* `inert` on the collapsed panel. The grid-rows trick
                   collapses the row to zero height but the text is still
                   in the DOM at full size — so a screen reader read every
                   answer whether or not it was open, and Tab could land
                   inside a panel with no visible height. `inert` takes the
                   subtree out of both the accessibility tree and the tab
                   order without needing `display:none`, which would kill
                   the open/close transition. */
                inert={!isOpen}
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  {/* The rule spans the whole column, but the answer keeps a
                      reading measure — a very long line of body copy is
                      uncomfortable to track back from.

                      The answer fades and lifts slightly as it arrives,
                      offset behind the row's own expansion. Unrolling
                      alone made long answers appear to scroll up from
                      under the question; a short fade lets the text
                      settle after the space for it already exists. */}
                  <p
                    className={`max-w-3xl pb-5 pr-10 text-sm leading-relaxed text-mdn-ink-body transition-all duration-300 sm:pb-6 sm:text-base ${
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
    </section>
  );
}
