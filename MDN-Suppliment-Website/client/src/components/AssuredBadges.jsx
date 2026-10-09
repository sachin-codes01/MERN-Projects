import { useState } from "react";
import { motion } from "motion/react";
import ItemCarousel from "./ItemCarousel";
import { EASE_OUT_QUINT } from "../lib/easings";
import { useMediaQuery } from "../hooks/useMediaQuery";
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


// Zoom-in: section screen pe neeche se aate hi har badge chhote se poore size me
// aata hai, ek-ek karke (index ke hisaab se delay). Trigger parent ka whileInView
// hai — slider ke side me chhupe badges bhi saath me animate ho jate hain.
const ZOOM = {
  hidden: { opacity: 0, scale: 0.55 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay: Math.min(i, 9) * 0.08, ease: EASE_OUT_QUINT },
  }),
};

// Sirf badge image — neeche naam nahi (label alt text me rehta hai, screen readers ke liye)
// `focus`: phone pe beech wala badge thoda bada (1.15x), baaki thode chhote (0.9x)
const Badge = ({ label, src, index, focus }) => (
  <motion.div variants={ZOOM} custom={index}>
    <div
      className={`aspect-square w-full overflow-hidden rounded-xl transition-transform duration-500 ease-brand-out hover:-translate-y-1 hover:rotate-[-4deg] ${
        focus === true ? "scale-[1.15]" : focus === false ? "scale-90" : ""
      }`}
    >
      <img src={src} alt={label} loading="lazy" className="h-full w-full object-contain" draggable="false" />
    </div>
  </motion.div>
);

const AssuredBadges = () => {
  // Zoom-in sirf phone pe; desktop pe badges bina animation ke seedhe dikhte hain
  const isMobile = useMediaQuery("(max-width: 767px)");
  // Phone pe 3 badge dikhte hain — beech wala = left wala index + 1
  const [first, setFirst] = useState(0);

  return (
  // Bottom padding halki — yeh trust strip hai, neeche wale section se juda lagna chahiye.
  <section className="section !pb-6">
    {/* "AS-IT-IS Assured" heading hata diya — sirf chhota eyebrow aur ek line */}
    <div className="flex flex-col items-center text-center">
      <Reveal from="up" duration={0.6} className="flex items-center gap-2">
        <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-mdn-orange-ink" />
        <span className="eyebrow">Certified &amp; Verified</span>
        <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-mdn-orange-ink" />
      </Reveal>
      <Reveal
        as="p"
        from="up"
        delay={0.1}
        duration={0.6}
        className="mt-2.5 max-w-[58ch] text-sm leading-relaxed text-mdn-ink-muted sm:text-base"
      >
        Every batch is tested, certified and verified
      </Reveal>
    </div>

    {/* Har screen pe slider — ek baar me ek badge aage badhta hai (auto + swipe),
        bina dots/progress line ke. Bade badges: phone pe 3, tablet 4, laptop 6, bade screen 7. */}
    <motion.div
      initial={isMobile ? "hidden" : false}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="mt-4 sm:mt-5"
    >
      <ItemCarousel
        items={BADGES}
        autoPlay
        interval={2600}
        showDots={false}
        showProgress={false}
        gapClassName="gap-3 sm:gap-5"
        itemClassName="w-[calc(33.333%-8px)] sm:w-[calc(25%-15px)] lg:w-[calc(16.666%-17px)] xl:w-[calc(14.285%-18px)]"
        onIndexChange={setFirst}
        renderItem={(b, i) => <Badge {...b} index={i} focus={isMobile ? i === first + 1 : undefined} />}
      />
    </motion.div>
  </section>
  );
};

export default AssuredBadges;
