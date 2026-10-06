import { useNavigate } from "react-router-dom";
import ItemCarousel from "./ItemCarousel";
import SectionHeading from "./SectionHeading";
import Reveal from "./motion/Reveal";
import ViewAllLink from "./ViewAllLink";
import leanMusclesImg from "../assets/Lean Muscles.png";
import guiltFreeGainsImg from "../assets/Guilt-Free Gains.png";
import weightLossImg from "../assets/Weight Loss.png";
import wellnessImmunityImg from "../assets/Wellness & Immunity.png";
import strengthEnduranceImg from "../assets/Strength & Endurance.png";
import bulkingUpImg from "../assets/Bulking Up.png";

// Each goal carries its own artwork — every card used to render the same
// generic Target.png, so the six tiles were visually indistinguishable.
//
// Order is deliberate: the two cards with a female model (Guilt-Free
// Gains, Weight Loss) sit at positions 2 and 5 rather than side by side.
// On a six-item loop that's three apart in BOTH directions, so they stay
// evenly spaced no matter where the carousel wraps — instead of both
// women appearing together in one screenful and none in the rest.
//
// Only the photo and the goal name are needed now: the card is the bare
// photo with its title UNDER it, so the old per-card `desc` and `tone`
// (the alternating green/tan card ground) no longer have anywhere to go.
const TARGETS = [
  { title: "Lean Muscles", query: "lean muscle", image: leanMusclesImg },
  { title: "Guilt-Free Gains", query: "protein food", image: guiltFreeGainsImg },
  { title: "Wellness & Immunity", query: "wellness", image: wellnessImmunityImg },
  { title: "Strength & Endurance", query: "pre workout", image: strengthEnduranceImg },
  { title: "Weight Loss", query: "fat loss", image: weightLossImg },
  { title: "Bulking Up", query: "mass gainer", image: bulkingUpImg },
];

// "What's Your Target?" — reference jaisa: left heading + "View all",
// mobile pe native swipe row (2+ cards dikhte hain), sm+ pe carousel.
const TargetSection = () => {
  const navigate = useNavigate();
  const go = (t) => navigate(`/search?q=${encodeURIComponent(t.query)}`);

  return (
    <section className="section !pb-3 !pt-9 sm:!pb-10">
      <SectionHeading
        align="left"
        eyebrow="Shop by goal"
        title="What's Your"
        accent="Target?"
        subtitle="Choose your objective to see recommended stacks"
        action={<ViewAllLink to="/products" />}
      />

      {/* Mobile: halka sa agla card dikhta hai, isliye pata chalta hai ki swipe karna hai */}
      <div
        className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:hidden"
      >
        {TARGETS.map((t) => (
          <div key={t.title} className="w-[42%] flex-shrink-0 snap-start">
            <TargetCard item={t} onClick={() => go(t)} />
          </div>
        ))}
      </div>

      {/* sm+: auto-advance carousel, hover pe ruk jata hai */}
      {/* Poori row me 3 card ek saath — cards 4:3 (kam lambe); photo object-contain se poori dikhti hai (crop nahi) */}
      <Reveal from="up" amount={0.2} className="mt-6 hidden sm:block">
        <ItemCarousel
          items={TARGETS}
          autoPlay
          interval={3200}
          showDots={false}
          showProgress
          gapClassName="gap-6"
          itemClassName="w-[calc(33.333%-16px)]"
          renderItem={(t) => <TargetCard item={t} onClick={() => go(t)} />}
        />
      </Reveal>
    </section>
  );
};

// Pehle wala card: sirf photo (rounded frame) aur neeche goal ka naam —
// photo ke upar koi text/overlay nahi, isliye model saaf dikhta hai.
const TargetCard = ({ item, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group block w-full text-center transition-transform duration-300 ease-brand-out hover:-translate-y-1"
  >
    <span className="block aspect-[9/10] w-full overflow-hidden rounded-[22px] sm:aspect-[4/3] bg-mdn-sand shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
      <img
        src={item.image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04] sm:object-contain sm:object-bottom"
      />
    </span>
    <span className="mt-3 block font-heading text-[15px] font-bold leading-snug text-mdn-ink transition-colors group-hover:text-mdn-green sm:text-[18px]">
      {item.title}
    </span>
  </button>
);

export default TargetSection;
