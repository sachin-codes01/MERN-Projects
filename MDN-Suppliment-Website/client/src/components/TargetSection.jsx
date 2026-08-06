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
const TARGETS = [
  {
    title: "Lean Muscles",
    query: "lean muscle",
    desc: "High-protein, low-carb stacks built for definition without the bulk.",
    image: leanMusclesImg,
    tone: "green",
  },
  {
    title: "Guilt-Free Gains",
    query: "protein food",
    desc: "Clean whole-food nutrition that fits real macros, not marketing.",
    image: guiltFreeGainsImg,
    tone: "tan",
  },
  {
    title: "Wellness & Immunity",
    query: "wellness",
    desc: "Daily essentials — multivitamins, omega-3s, gut and immune support.",
    image: wellnessImmunityImg,
    tone: "green",
  },
  {
    title: "Strength & Endurance",
    query: "pre workout",
    desc: "Pre-workouts and creatine to push harder, longer, every session.",
    image: strengthEnduranceImg,
    tone: "tan",
  },
  {
    title: "Weight Loss",
    query: "fat loss",
    desc: "Fat burners and low-sugar formulas to support a real calorie deficit.",
    image: weightLossImg,
    tone: "green",
  },
  {
    title: "Bulking Up",
    query: "mass gainer",
    desc: "Calorie-dense mass gainers built for serious, sustained size gains.",
    image: bulkingUpImg,
    tone: "tan",
  },
];

export default function TargetSection() {
  const navigate = useNavigate();

  // Gutters live on the <section> here (not on the inner max-w-shell div)
  // because the decorative glow/grid behind it must run full bleed — so
  // this element carries the same px steps as every other shell.
  return (
    <section className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-12 lg:px-[34px]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full bg-mdn-green/10 blur-[100px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
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

        {/* Single row now, sliding one card at a time — auto-advances,
            pauses on hover, drag/swipe, and arrow buttons — instead of the
            old two-row static grid. */}
        <div className="mt-10">
          <ItemCarousel
            items={TARGETS}
            autoPlay
            interval={3200}
            itemClassName="w-[80%] sm:w-[46%] lg:w-[24%]"
            renderItem={(t) => (
              // Solid colour card, alternating green / tan per the
              // reference — NOT a photo with a dark scrim over it. The
              // copy sits on the flat ground on the left and the model
              // photo occupies the right, so the two never overlap and
              // the text needs no gradient to stay legible.
              <button
                onClick={() => navigate(`/search?q=${encodeURIComponent(t.query)}`)}
                className={`group relative flex aspect-[16/10] w-full overflow-hidden rounded-2xl text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg ${
                  t.tone === "tan" ? "bg-mdn-tan" : "bg-mdn-green-light"
                }`}
              >
                {/* Model photo, right-hand side. The source art is a
                    1086x1448 portrait, so `object-cover object-top` keeps
                    the head in frame and crops from the legs up as the
                    card gets shorter — `contain` would letterbox it and
                    expose the card ground down both sides of the figure. */}
                <img
                  src={t.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="absolute bottom-0 right-0 h-full w-[44%] object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                />

                {/* Copy column is capped at 58% so a long title can never
                    run under the photo.

                    Type is sized off the reference rather than picked by
                    feel: there the card is 125px tall and its text block
                    fills 93px of it — title, description and arrow nearly
                    span the card. At the earlier 15px/11.5px the same
                    block only filled about half the height, and
                    `justify-between` turned the remainder into one large
                    hole in the middle. */}
                <span className="relative z-10 flex h-full w-[58%] flex-col justify-between p-3.5">
                  <span className="block">
                    {/* line-clamp-2 on the TITLE as well as the
                        description. The copy column is only ~130px wide
                        at this card size, so "Wellness & Immunity" and
                        "Strength & Endurance" run to three lines if left
                        unclamped — which is what tipped the content past
                        the card's height. Two lines each keeps every card
                        the same shape whatever the goal is called. */}
                    <span className="line-clamp-2 block text-[16px] font-extrabold uppercase leading-[1.12] tracking-tight text-white sm:text-[20px]">
                      {t.title}
                    </span>
                    <span className="mt-1.5 line-clamp-4 block text-[12px] leading-snug text-white/85 sm:text-[14px]">
                      {t.desc}
                    </span>
                  </span>


                  {/* Circular arrow, bottom-left, as in the reference.
                      It inverts on hover — the ring fills white and the
                      arrow takes the card's own ground colour. */}
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/70 text-white transition-all duration-300 group-hover:bg-white ${
                      t.tone === "tan" ? "group-hover:text-mdn-tan" : "group-hover:text-mdn-green-light"
                    }`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </button>
            )}
          />
        </div>
      </div>
    </section>
  );
}
