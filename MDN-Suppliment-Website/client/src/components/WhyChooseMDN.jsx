import { Link } from "react-router-dom";
import Reveal from "./motion/Reveal";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import BiotechOutlinedIcon from "@mui/icons-material/BiotechOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";

// Order is INTERLEAVED, not sequential, because the grid below fills
// row-major (1,2 / 3,4 / 5,6) while the reference reads column-major:
//   Premium Quality        | Made for Indians
//   Scientifically Formul. | No Banned Substances
//   Lab Tested             | Trusted by Thousands
// Listing them in this order is what puts each pair on the right row.
const FEATURES = [
  { title: "Premium Quality", desc: "Only the finest ingredients", Icon: WorkspacePremiumOutlinedIcon },
  { title: "Made for Indians", desc: "Nutrition for our lifestyle", Icon: PublicOutlinedIcon },
  { title: "Scientifically Formulated", desc: "Advanced research backed", Icon: ScienceOutlinedIcon },
  { title: "No Banned Substances", desc: "100% safe & trustworthy", Icon: VerifiedUserOutlinedIcon },
  { title: "Lab Tested", desc: "Every batch is lab tested", Icon: BiotechOutlinedIcon },
  { title: "Trusted by Thousands", desc: "Loved by 50,000+ customers", Icon: GroupsOutlinedIcon },
];

// Per the brief this section absorbs the old WHY ONE messaging (lab tested
// every batch, nothing hidden in the blend) rather than repeating it in a
// second section — "Lab Tested" and "No Banned Substances" below carry
// those claims. The footer link was renamed to match, so the anchor is
// `why-choose-mdn` rather than the old `why-one`.
const WhyChooseMDN = () => {
  return (
    // Full-bleed tinted BAND, not a rounded card. In the reference this
    // section runs edge to edge with no corner radius and no gutter —
    // it's one of the page's alternating colour bands, which is what
    // gives the layout its rhythm. Boxing it into an inset card broke
    // that and made it read as a widget sitting on the page.
    //
    // Plain `w-full`, NOT the `left-1/2 -mx-[50vw] w-screen` breakout
    // used elsewhere: this section is already a direct child of <main>,
    // which spans the full content width, so it fills edge to edge on
    // its own. The 100vw breakout would actively hurt here — 100vw
    // measures the viewport INCLUDING the scrollbar, so it overhangs by
    // the scrollbar's width and drags the inner wrapper a few px off,
    // leaving this band's content misaligned against every other
    // section's left edge.
    <section id="why-choose-mdn" className="band-soft ambient w-full">
      <div className="section">
        {/* Left pitch / right feature grid. The 0.85fr : 1.6fr split (not
            a plain 1:1) matches the reference, where the copy column is
            noticeably narrower than the six-item grid beside it. Below
            `lg` the two stack and the divider rule is dropped. */}
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.6fr] lg:items-center lg:gap-14">
          <Reveal from="up" className="lg:pr-4">
            {/* `.eyebrow`, not a green label. Two reasons: dark-mode
                --green-primary on the dark sand band measured 3.31:1,
                and every other section on the page introduces itself
                with `.eyebrow` — this was the only one using a coloured
                variant, so it read as a different kind of thing. */}
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="h-px w-5 bg-mdn-orange-ink" />
              <p className="eyebrow">Why Choose MDN</p>
            </div>

            {/* font-body overrides the Didot default on h2. This heading
                is a heavy uppercase SANS in the reference — the didone is
                reserved for the centred section titles elsewhere on the
                page, and mixing the two here would flatten that
                distinction. */}
            <h2 className="display-xl mt-1.5">
              Powered by science.
              <br />
              Backed by <span className="display-accent">results.</span>
            </h2>

            <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-mdn-ink-body sm:text-base">
              At MDN, we believe in clean nutrition, premium ingredients and real results. Fuel your
              body with the best.
            </p>

            <Link to="/products" className="btn-primary group mt-5 !px-5 !py-2.5">
              Know More
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </Reveal>

          {/* Hairline rule between the two halves, desktop only. Drawn as a
              left border on this column rather than a separate grid track,
              so it always spans the taller of the two columns. */}
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {FEATURES.map(({ title, desc, Icon }, i) => (
              <Reveal
                as="li"
                key={title}
                from="up"
                delay={i * 0.06}
                className="lift group flex flex-col gap-3 rounded-xl border border-mdn-border bg-mdn-charcoal p-4 shadow-xs sm:flex-row sm:items-start sm:gap-3.5 sm:p-5"
              >
                <span
                  aria-hidden="true"
                  className="lift-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mdn-green-soft text-mdn-green transition-colors duration-300 group-hover:bg-mdn-green group-hover:text-mdn-on-primary"
                >
                  <Icon sx={{ fontSize: 22 }} />
                </span>
                <div className="min-w-0">
                  <p className="font-heading text-[15px] font-semibold leading-snug text-mdn-ink sm:text-base">{title}</p>
                  <p className="mt-1 text-[13px] leading-snug text-mdn-ink-muted sm:text-sm">{desc}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseMDN;
