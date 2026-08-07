import Reveal from "./motion/Reveal";
import MaskReveal from "./motion/MaskReveal";

/**
 * The lead-in every storefront section opens with. Centred.
 *
 * The previous version was also centred, but built as a rule–title–rule
 * sandwich: a hairline to the left of the title and another to the right.
 * That specific arrangement is dropped for two reasons. It fixed every
 * heading to the same silhouette no matter how long the title was, and
 * the flanking rules squeezed longer titles ("What's Your Target?") into
 * a narrower box than short ones, so the type size effectively changed
 * from section to section.
 *
 * What replaces it keeps the centred axis and spends the emphasis on
 * type instead: eyebrow in letterspaced Jost caps, the title in Didot at
 * its real weight, and a single short rule UNDER the title acting as a
 * thought break. One rule below rather than two beside means the title
 * gets the full column width, and the mark reads as punctuation rather
 * than as decoration bracketing the words.
 *
 * Props are unchanged (`eyebrow` / `title` / `accent` / `subtitle` /
 * `className`), so all eight existing call sites pick this up untouched.
 * `index` and `action` are new and optional.
 *
 * @param {string}  [index]    Folio numeral, e.g. "02", shown before the
 *                             eyebrow. Only pass it where sections form a
 *                             real read-down sequence (the home page); a
 *                             numeral on a lone section counts something
 *                             the reader cannot see.
 * @param {ReactNode} [action] Optional control centred beneath the
 *                             subtitle, e.g. a "View all" link.
 */
export default function SectionHeading({
  eyebrow,
  title,
  accent,
  subtitle,
  index,
  action,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {(eyebrow || index) && (
        <Reveal
          from="up"
          duration={0.7}
          className="flex items-baseline justify-center gap-2.5"
        >
          {index && (
            <span aria-hidden="true" className="section-index">
              {index}
            </span>
          )}
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        </Reveal>
      )}

      {/* No `font-black`. `display-lg` resolves to "Didot Title", which
          ships a single 400 weight — a bold utility on it does not select
          a heavier cut, it makes the browser smear the outline, which
          flattens exactly the thick/thin contrast a didone exists for.
          See the synthetic-bold guard in index.css. */}
      <MaskReveal
        as="h2"
        className={`display-lg ${eyebrow || index ? "mt-3" : ""}`}
        lines={[
          <>
            {title} {accent && <span className="display-accent">{accent}</span>}
          </>,
        ]}
      />

      {/* The thought break. Short, centred, and in the accent so it ties
          back to the italic word in the title above it. */}
      <Reveal
        from="up"
        delay={0.1}
        duration={0.7}
        aria-hidden="true"
        className="mt-4 h-px w-10 bg-mdn-orange/70 sm:w-12"
      />

      {subtitle && (
        <Reveal
          as="p"
          from="up"
          delay={0.18}
          duration={0.7}
          /* max-w in `ch` rather than a `max-w-md` guess: this caps the
             line at a readable measure (~58 characters) whatever the font
             size resolves to at the current breakpoint. */
          className="mt-4 max-w-[58ch] text-sm leading-relaxed text-mdn-ink-body sm:text-[15px]"
        >
          {subtitle}
        </Reveal>
      )}

      {action && (
        <Reveal from="up" delay={0.24} duration={0.7} className="mt-6">
          {action}
        </Reveal>
      )}
    </div>
  );
}
