import Carousel from "./Carousel";
import SectionHeading from "./SectionHeading";
import badgeImg from "../assets/Trustifies_1.webp";

const BADGE_LABELS = [
  "Trustified",
  "Labdoor",
  "Lab Tested",
  "200% Money Back",
  "One Ingredient",
  "In-House Made",
  "Zero Additives",
  "QR-Verified",
];

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function AssuredBadges() {
  // grid-cols-4 is fixed at every breakpoint now (was grid-cols-2 on
  // mobile, which wrapped into 2 rows) — combined with much smaller
  // badge sizes, all 4 badges in a slide now sit in a single row even
  // on the narrowest phone screens.
  const slides = chunk(BADGE_LABELS, 4).map((group, gi) => (
    <div key={gi} className="grid grid-cols-4 gap-2 px-1 sm:gap-6 lg:gap-8">
      {group.map((label, i) => (
        <div key={i} className="flex flex-col items-center gap-2 text-center sm:gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-xl border border-mdn-green/30 bg-mdn-charcoal2 shadow-card sm:h-32 sm:w-32 lg:h-44 lg:w-44">
            <img src={badgeImg} alt={label} className="h-full w-full object-cover" />
          </div>
          <p className="line-clamp-2 text-[8px] font-semibold uppercase leading-tight tracking-wide text-mdn-white sm:text-sm lg:text-base">
            {label}
          </p>
        </div>
      ))}
    </div>
  ));

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
      <SectionHeading eyebrow="Certified & Verified" title="AS-IT-IS" accent="Assured" />

      <div className="mt-10">
        <Carousel slides={slides} autoPlay interval={4500} showArrows={false} />
      </div>
    </section>
  );
}
