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
export default function WhyChooseMDN() {
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
    <section id="why-choose-mdn" className="w-full bg-mdn-sand py-9 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-shell px-4 sm:px-6 lg:px-[34px]">
        {/* Left pitch / right feature grid. The 0.85fr : 1.6fr split (not
            a plain 1:1) matches the reference, where the copy column is
            noticeably narrower than the six-item grid beside it. Below
            `lg` the two stack and the divider rule is dropped. */}
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.6fr] lg:gap-14">
          <Reveal from="up" className="lg:pr-4">
            {/* `.eyebrow`, not a green label. Two reasons: dark-mode
                --green-primary on the dark sand band measured 3.31:1,
                and every other section on the page introduces itself
                with `.eyebrow` — this was the only one using a coloured
                variant, so it read as a different kind of thing. */}
            <p className="eyebrow">Why Choose MDN</p>

            {/* font-body overrides the Didot default on h2. This heading
                is a heavy uppercase SANS in the reference — the didone is
                reserved for the centred section titles elsewhere on the
                page, and mixing the two here would flatten that
                distinction. */}
            <h2 className="mt-3 font-body text-[26px] font-extrabold uppercase leading-[1.12] tracking-[-0.01em] text-mdn-ink sm:text-[32px]">
              Powered by science.
              <br />
              Backed by <span className="text-mdn-orange">results.</span>
            </h2>

            <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-mdn-ink-body">
              At MDN, we believe in clean nutrition, premium ingredients and real results. Fuel your
              body with the best.
            </p>

            <Link to="/products" className="btn-primary group mt-7 !px-5 !py-2.5 text-[11px]">
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
          <ul className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:border-l lg:border-mdn-border-strong lg:pl-14">
            {FEATURES.map(({ title, desc, Icon }, i) => (
              <Reveal as="li" key={title} from="up" delay={i * 0.06} className="flex items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mdn-blush text-mdn-green"
                >
                  <Icon sx={{ fontSize: 21 }} />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold leading-snug text-mdn-ink">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-mdn-ink-body">{desc}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
