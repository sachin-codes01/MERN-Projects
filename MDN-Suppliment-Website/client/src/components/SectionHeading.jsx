import Reveal from "./motion/Reveal";
import MaskReveal from "./motion/MaskReveal";

/**
 * Har storefront section ka heading block — reference (Ripped Up) style.
 *
 * Do layout hain:
 *  - align="center" (default): "Trusted By 500k+ Customers" jaisa centred
 *    bold heading, accent hissa orange + underline, neeche chhota gray subtitle.
 *  - align="left": "SHOP BY GOAL / What's Your Target?" jaisa — upar orange
 *    eyebrow (dash ke saath), bold heading, aur `action` (e.g. "View all")
 *    right side pe same row me.
 *
 * Props pehle jaise hi hain (`eyebrow` / `title` / `accent` / `subtitle` /
 * `index` / `action` / `className`), isliye saare call sites bina badle chalte hain.
 * `index` ab dikhaya nahi jata (reference me folio numbers nahi hain).
 */
const SectionHeading = ({
  eyebrow,
  title,
  accent,
  subtitle,
  action,
  align = "center",
  className = "",
}) => {
  const isLeft = align === "left";

  const heading = (
    <MaskReveal
      as="h2"
      className={`display-lg ${eyebrow ? "mt-1.5" : ""}`}
      lines={[
        <>
          {title} {accent && <span className="display-accent">{accent}</span>}
        </>,
      ]}
    />
  );

  if (isLeft) {
    return (
      <div className={`flex items-end justify-between gap-4 ${className}`}>
        <div className="min-w-0 flex-1 sm:flex-initial">
          {eyebrow && (
            <Reveal from="up" duration={0.6} className="flex items-center gap-2">
              <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-mdn-orange-ink" />
              <span className="eyebrow">{eyebrow}</span>
              {/* Mobile pe action eyebrow wali line me (right side) — heading ko poori width milti hai */}
              {action && <span className="ml-auto sm:hidden">{action}</span>}
            </Reveal>
          )}
          {heading}
          {subtitle && (
            <Reveal
              as="p"
              from="up"
              delay={0.12}
              duration={0.6}
              className="mt-2 max-w-[60ch] text-sm leading-relaxed text-mdn-ink-muted sm:text-base"
            >
              {subtitle}
            </Reveal>
          )}
        </div>
        {action && (
          <Reveal from="up" delay={0.16} duration={0.6} className={`flex-shrink-0 ${eyebrow ? "hidden sm:block" : ""}`}>
            {action}
          </Reveal>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {eyebrow && (
        <Reveal from="up" duration={0.6} className="flex items-center gap-2">
          <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-mdn-orange-ink" />
          <span className="eyebrow">{eyebrow}</span>
          <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-mdn-orange-ink" />
        </Reveal>
      )}

      {heading}

      {subtitle && (
        <Reveal
          as="p"
          from="up"
          delay={0.12}
          duration={0.6}
          className="mt-2.5 max-w-[58ch] text-sm leading-relaxed text-mdn-ink-muted sm:text-base"
        >
          {subtitle}
        </Reveal>
      )}

      {action && (
        <Reveal from="up" delay={0.18} duration={0.6} className="mt-4">
          {action}
        </Reveal>
      )}
    </div>
  );
};

export default SectionHeading;
