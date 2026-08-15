import Carousel from "./Carousel";
import SectionHeading from "./SectionHeading";
import Reveal from "./motion/Reveal";
// Renamed from the original export names ("200% Money Back.png", "Lab
// Tested.png", …) to kebab-case. The "%" was not optional: the browser
// requests an unencoded "%" as a literal, so Vite's dev server received
// "200%%20Money%20Back.png", 404'd, and the failed import took the whole
// module graph down — the entire app rendered blank in `npm run dev`.
// The production build happened to survive because Vite rewrites asset
// filenames on emit, which made it look fine in `npm run build` only.
// Keep new badge exports kebab-case: no spaces, no "%".
import madeWithPrecision from "../assets/badge-made-with-precision.png";
import trustified from "../assets/badge-trustified.png";
import labdoor from "../assets/badge-labdoor.png";
import isoVerified from "../assets/badge-iso-verified.png";
import gmpCertified from "../assets/badge-gmp-certified.png";
import labTested from "../assets/badge-lab-tested.png";
import zeroAdditives from "../assets/badge-zero-additives.png";
import fssaiApproved from "../assets/badge-fssai-approved.png";
import inHouseMade from "../assets/badge-in-house-made.png";
import oneIngredient from "../assets/badge-one-ingredient.png";

// The official seal set. The claim is also lettered into the artwork, but
// the caption below each badge is kept: at the mobile carousel size the
// lettering inside the seal is too small to read, and the caption is what
// makes the row scannable at a glance on desktop.
const BADGES = [
  { label: "Made With Precision", src: madeWithPrecision },
  { label: "Trustified", src: trustified },
  { label: "Labdoor", src: labdoor },
  { label: "ISO Verified", src: isoVerified },
  { label: "GMP Certified", src: gmpCertified },
  { label: "Lab Tested", src: labTested },
  { label: "Zero Additives", src: zeroAdditives },
  { label: "FSSAI Approved", src: fssaiApproved },
  { label: "In-House Made", src: inHouseMade },
  { label: "One Ingredient", src: oneIngredient },
];

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const Badge = ({ label, src }) => (
  <div className="flex flex-col items-center gap-2 text-center sm:gap-3">
    {/* No hover lift/border/shadow here by request — these are static
        trust seals, not clickable cards, so they shouldn't behave like
        the product tiles elsewhere on the page. object-contain rather
        than object-cover: the seals are circular with their own margin
        baked in, and cover was cropping the gold ring at the edges. */}
    <div className="aspect-square w-full overflow-hidden rounded-xl">
      <img src={src} alt={label} loading="lazy" className="h-full w-full object-contain" />
    </div>
    {/* lg steps DOWN to text-sm (xl returns to the original text-base):
        ten columns instead of eight makes each one ~110px on a 1280px
        screen, and the two longest labels ("Made With Precision", "FSSAI
        Approved") lost their second line to line-clamp-2 at text-base. */}
    <p className="line-clamp-2 text-[8px] font-semibold uppercase leading-tight tracking-wide text-mdn-white sm:text-sm lg:text-sm xl:text-base">
      {label}
    </p>
  </div>
);

const AssuredBadges = () => {
  // Chunked 5-at-a-time, not 4: ten badges over 4 would leave a final
  // slide holding 2 seals and a gap. Two even slides of 5, and the column
  // count is fixed at every breakpoint so a slide never wraps to 2 rows.
  const slides = chunk(BADGES, 5).map((group, gi) => (
    <div key={gi} className="grid grid-cols-5 gap-2 px-1 sm:gap-6">
      {group.map((b) => (
        <Badge key={b.label} {...b} />
      ))}
    </div>
  ));

  return (
    // Bottom padding is deliberately lighter than the top. This is a slim
    // trust strip, not a full section — its own 64px plus the following
    // section's 64px stacked into a 128px void under a single short row
    // of badges. Halving the bottom keeps the badges reading as attached
    // to the content they vouch for.
    <section className="mx-auto max-w-shell px-4 pb-6 pt-10 sm:px-6 sm:pb-8 sm:pt-12 lg:px-[34px]">
      <SectionHeading index="03" eyebrow="Certified & Verified" title="AS-IT-IS" accent="Assured" />

      {/* At lg+ the full content shell holds all ten badges in ONE row, so
          the carousel is dropped there entirely — paging across 1536px
          left each badge floating in a wide column with dead air on both
          sides. grid-cols-10, not 5 x 2: wrapping to a second row makes
          each seal half the shell wide, which reads as a huge feature
          block rather than the slim trust strip this is meant to be. The
          badge boxes are sized by the grid track (w-full + aspect-square)
          rather than a fixed width, so they shrink to fit the row instead
          of overflowing. The carousel is kept below lg, where 10 across
          genuinely doesn't fit. */}
      <div className="mt-10 hidden grid-cols-10 gap-3 lg:grid xl:gap-4">
        {BADGES.map((b, i) => (
          <Reveal key={b.label} from="scale" delay={(i % 10) * 0.08} amount={0.35}>
            <Badge {...b} />
          </Reveal>
        ))}
      </div>

      <div className="mt-10 lg:hidden">
        <Carousel slides={slides} autoPlay interval={4500} showArrows={false} />
      </div>

      {/* Closing rule, so this strip and "Our Bestsellers" below it read as
          two separate sections rather than one continuous run. It lives
          INSIDE the section (rather than as a border on the section box) so
          it lines up with the content column instead of stretching out into
          the gutters.

          `border-strong` rather than the softer default: on the cream page
          ground (#fef4e9) the soft token is only a few values away and the
          hairline all but vanishes, which defeats the point of a divider. */}
      <div className="mt-8 border-t border-mdn-border-strong sm:mt-10" />
    </section>
  );
};

export default AssuredBadges;
