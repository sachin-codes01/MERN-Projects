import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useInView } from "motion/react";
import SectionHeading from "./SectionHeading";
import Reveal from "./motion/Reveal";
import ViewAllLink from "./ViewAllLink";
import collagenVideo from "../assets/1-video.mp4";
import preWorkoutVideo from "../assets/2nd video.mp4";
import wheyVideo from "../assets/3rd video.mp4";
import wellnessVideo from "../assets/4th video.mp4";

// Har goal ka apna product video (478x850, 9:16 portrait — reels jaisa).
const TARGETS = [
  { title: "Skin & Glow", query: "collagen", video: collagenVideo },
  { title: "Strength & Endurance", query: "pre workout", video: preWorkoutVideo },
  { title: "Lean Muscles", query: "whey protein", video: wheyVideo },
  { title: "Wellness & Immunity", query: "liver", video: wellnessVideo },
];

// "What's Your Target?" — 4 reel-style video cards. Tablet/desktop pe chaaron
// ek row me; phone pe side me swipe.
const TargetSection = () => {
  const navigate = useNavigate();
  const go = (t) => navigate(`/search?q=${encodeURIComponent(t.query)}`);

  // Phone row ka auto-scroll: har 3s ek card aage. User swipe/touch kare to 4s
  // ke liye ruk jata hai (manual scroll chalta rahe).
  // Infinite loop: cards do baar render hote hain. Jaise hi row dusre set me
  // pahunche, chupke se utna hi peeche (pehle set me same jagah) — dikhta same
  // hai, isliye aakhri ke baad pehla card aage hi aata hai, rewind nahi hota.
  const rowRef = useRef(null);
  const lastTouch = useRef(0);
  const settleTimer = useRef(null);
  const rowInView = useInView(rowRef, { amount: 0.4 });

  useEffect(() => {
    if (!rowInView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      const el = rowRef.current;
      if (!el || Date.now() - lastTouch.current < 4000) return;
      const card = el.firstElementChild;
      if (!card) return;
      const step = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || 0);
      el.scrollTo({ left: el.scrollLeft + step, behavior: "smooth" });
    }, 3000);
    return () => clearInterval(id);
  }, [rowInView]);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  const markTouch = () => (lastTouch.current = Date.now());

  // Scroll rukne pe: agar dusre set me hain to ek set peeche jump (bina animation)
  const onRowScroll = () => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const el = rowRef.current;
      const cards = el?.children;
      if (!cards || cards.length <= TARGETS.length) return;
      const setWidth = cards[TARGETS.length].offsetLeft - cards[0].offsetLeft;
      if (el.scrollLeft >= setWidth - 2) el.scrollLeft -= setWidth;
    }, 150);
  };

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

      {/* Phone: swipe row — agla card halka sa dikhta hai, pata chalta hai ki swipe karna hai */}
      <div
        ref={rowRef}
        onTouchStart={markTouch}
        onPointerDown={markTouch}
        onWheel={markTouch}
        onScroll={onRowScroll}
        className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:hidden"
      >
        {[...TARGETS, ...TARGETS].map((t, i) => (
          <div key={i} className="w-[44%] flex-shrink-0 snap-start">
            <TargetCard item={t} onClick={() => go(t)} />
          </div>
        ))}
      </div>

      {/* Tablet/desktop: chaaron video ek row me */}
      <div className="mt-6 hidden grid-cols-4 gap-4 sm:grid lg:gap-6">
        {TARGETS.map((t, i) => (
          <Reveal key={t.title} from="up" delay={i * 0.08} amount={0.2}>
            <TargetCard item={t} onClick={() => go(t)} />
          </Reveal>
        ))}
      </div>
    </section>
  );
};

// Video card: 9:16 frame, neeche goal ka naam. Video sirf tab chalta hai jab
// card screen pe ho — bahar jaate hi pause (battery/data bachane ke liye).
const TargetCard = ({ item, onClick }) => {
  const videoRef = useRef(null);
  const inView = useInView(videoRef, { amount: 0.3 });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) v.play().catch(() => {});
    else v.pause();
  }, [inView]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full text-center transition-transform duration-300 ease-brand-out hover:-translate-y-1"
    >
      <span className="block aspect-[9/16] w-full overflow-hidden rounded-[22px] bg-mdn-sand shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
        <video
          ref={videoRef}
          // #t=0.1 — play se pehle bhi pehla frame dikhta hai (khaali card nahi)
          src={`${item.video}#t=0.1`}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </span>
      <span className="mt-3 block font-heading text-[15px] font-bold leading-snug text-mdn-ink transition-colors group-hover:text-mdn-green sm:text-[18px]">
        {item.title}
      </span>
    </button>
  );
};

export default TargetSection;
