import { useNavigate } from "react-router-dom";
import ItemCarousel from "./ItemCarousel";
import SectionHeading from "./SectionHeading";
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

export default function TargetSection() {
  const navigate = useNavigate();

  // Gutters live on the <section> here (not on the inner max-w-shell div)
  // because the decorative glow/grid behind it must run full bleed — so
  // this element carries the same px steps as every other shell.
  return (
    <section className="relative overflow-hidden px-4 py-8 sm:px-6 sm:py-10 lg:px-[34px]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full bg-mdn-green/10 blur-[100px]" />
      {/* Grid mesh behind the cards. Was opacity-[0.03], which on the cream
          ground put the 1px lines about 5 values away from the background —
          effectively invisible. 0.09 lands them ~20 values off, so the mesh
          actually reads without competing with the photos.
          Dark mode stays lower: there the same lines are LIGHT on a dark
          ground, where the eye picks them up far more easily. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.09] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--mdn-white)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--mdn-white)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-shell">
        <SectionHeading
          eyebrow="Goal-based stacks"
          title="What's Your"
          accent="Target?"
          subtitle="Choose your objective to see recommended stacks."
        />

        {/* Below `sm`: all six goals as a static 2-across grid (three
            rows), so nothing is hidden behind a swipe on a phone. The two
            layouts are swapped with `sm:hidden` / `hidden sm:block` —
            only one is ever visible, and the hidden one's images never
            fetch because `display: none` suppresses lazy loading. */}
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:hidden">
          {TARGETS.map((t) => (
            <TargetCard key={t.title} item={t} onClick={() => navigate(`/search?q=${encodeURIComponent(t.query)}`)} />
          ))}
        </div>

        {/* `sm` and up: unchanged single row, sliding one card at a time —
            auto-advances, pauses on hover, drag/swipe, arrow buttons. */}
        <div className="mt-10 hidden sm:block">
          <ItemCarousel
            items={TARGETS}
            autoPlay
            interval={3200}
            itemClassName="w-[62%] sm:w-[44%] lg:w-[24%]"
            renderItem={(t) => (
              <TargetCard item={t} onClick={() => navigate(`/search?q=${encodeURIComponent(t.query)}`)} />
            )}
          />
        </div>
      </div>
    </section>
  );
}

// Bare photo tile with the goal name UNDER it, per the reference — no
// coloured ground, no scrim, no description and no arrow. Nothing sits on
// top of the photo, so the model is never competing with text.
//
// Shared by both layouts above, so the mobile grid and the desktop
// carousel can never drift apart.
const TargetCard = ({ item, onClick }) => (
  <button
    onClick={onClick}
    className="group block w-full text-center transition-transform duration-300 hover:-translate-y-1.5"
  >
    {/* Roughly square-but-taller frame, matching the reference's
        portrait-ish tiles. The source art is a 1086x1448 portrait, so
        `object-cover object-top` keeps the head in frame and crops from
        the legs up. */}
    <span className="block aspect-[9/10] w-full overflow-hidden rounded-[22px] bg-mdn-sand shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
      <img
        src={item.image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
      />
    </span>

    {/* Label on the page ground, not on the card. text-mdn-white is the
        theme's primary INK token (warm near-black in light mode), so this
        stays readable in both themes. */}
    <span className="mt-3 block text-[15px] font-bold leading-snug text-mdn-white sm:mt-4 sm:text-[18px]">
      {item.title}
    </span>
  </button>
);
