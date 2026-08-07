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
import trustified from "../assets/badge-trustified.jpg";
import labdoor from "../assets/badge-labdoor.png";
import labTested from "../assets/badge-lab-tested.png";
import moneyBack from "../assets/badge-money-back.png";
import oneIngredient from "../assets/badge-one-ingredient.png";
import inHouseMade from "../assets/badge-in-house-made.png";
import zeroAdditives from "../assets/badge-zero-additives.png";
import qrVerified from "../assets/badge-qr-verified.png";

// Every badge now has its own artwork. This used to be one shared image
// (Trustifies_1.jpg) repeated behind all eight labels, so the seal always
// read "Trustified" no matter which claim was captioned underneath it.
//
// The claim is also lettered into the artwork, but the caption below each
// badge is kept: at the mobile carousel size the lettering inside the
// seal is too small to read, and the caption is what makes the row
// scannable at a glance on desktop.
const BADGES = [
  { label: "Trustified", src: trustified },
  { label: "Labdoor", src: labdoor },
  { label: "Lab Tested", src: labTested },
  { label: "200% Money Back", src: moneyBack },
  { label: "One Ingredient", src: oneIngredient },
  { label: "In-House Made", src: inHouseMade },
  { label: "Zero Additives", src: zeroAdditives },
  { label: "QR-Verified", src: qrVerified },
];

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function Badge({ label, src }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center sm:gap-3">
      {/* No hover lift/border/shadow here by request — these are static
          trust seals, not clickable cards, so they shouldn't behave like
          the product tiles elsewhere on the page. */}
      <div className="aspect-square w-full overflow-hidden rounded-xl">
        <img src={src} alt={label} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <p className="line-clamp-2 text-[8px] font-semibold uppercase leading-tight tracking-wide text-mdn-white sm:text-sm lg:text-base">
        {label}
      </p>
    </div>
  );
}

export default function AssuredBadges() {
  // grid-cols-4 is fixed at every breakpoint here (was grid-cols-2 on
  // mobile, which wrapped into 2 rows) — all 4 badges in a slide sit in a
  // single row even on the narrowest phone screens.
  const slides = chunk(BADGES, 4).map((group, gi) => (
    <div key={gi} className="grid grid-cols-4 gap-2 px-1 sm:gap-6">
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

      {/* At lg+ the full content shell is wide enough to hold all eight
          badges in one row, so the carousel is dropped there entirely —
          paging 4-at-a-time across 1536px left each badge floating in a
          ~370px column with dead air on both sides. The badge boxes are
          sized by the grid track (w-full + aspect-square) rather than a
          fixed w-44, so they grow into the row instead of leaving gaps.
          The carousel is kept below lg, where 8 across genuinely doesn't
          fit. */}
      <div className="mt-10 hidden grid-cols-8 gap-4 lg:grid xl:gap-6">
        {BADGES.map((b, i) => (
          <Reveal key={b.label} from="scale" delay={(i % 8) * 0.08} amount={0.35}>
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
}
