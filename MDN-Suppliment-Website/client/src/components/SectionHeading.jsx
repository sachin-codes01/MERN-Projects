import Reveal from "./motion/Reveal";
import MaskReveal from "./motion/MaskReveal";

export default function SectionHeading({ eyebrow, title, accent, subtitle, className = "" }) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {eyebrow && (
        <Reveal as="p" from="up" duration={0.7} className="text-xs font-semibold uppercase tracking-widest text-mdn-green">
          {eyebrow}
        </Reveal>
      )}
      <div className={`flex items-center gap-3 sm:gap-5 ${eyebrow ? "mt-2" : ""}`}>
        <span className="h-px w-7 shrink-0 bg-mdn-green sm:w-14" />
        <MaskReveal
          as="h2"
          className="font-display text-2xl font-black uppercase tracking-wide text-mdn-white sm:text-4xl"
          lines={[
            <>
              {/* Accent word is orange, per the reference — "SHOP BY
                  COLLECTION", "OUR BESTSELLERS", "WHAT'S YOUR TARGET?",
                  "REAL PEOPLE. REAL STORIES" all set the second half in
                  the rust accent against the dark first half. */}
              {title} {accent && <span className="font-serif italic text-mdn-orange">{accent}</span>}
            </>,
          ]}
        />
        <span className="h-px w-7 shrink-0 bg-mdn-green sm:w-14" />
      </div>
      {subtitle && (
        <Reveal as="p" from="up" delay={0.15} duration={0.7} className="mt-3 max-w-md text-sm text-mdn-gray sm:text-base">
          {subtitle}
        </Reveal>
      )}
    </div>
  );
}
