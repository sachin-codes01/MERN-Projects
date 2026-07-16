import { useEffect, useState } from "react";
import mdnHero from "../assets/mdn-0.png";
import bodyUp from "../assets/body-up.png";
import bodyDown from "../assets/body-down.png";
import mdnP1 from "../assets/mdn-1.png";
import mdnP2 from "../assets/mdn-2.png";
import mdnP3 from "../assets/mdn-3.png";
import mdnP4 from "../assets/mdn-4.png";

const CYCLE_WORDS = ["PURE.", "TESTED.", "POWERFUL.", "TRUSTED."];
const HERO_PHOTOS = [mdnHero, bodyUp, bodyDown];

const INTRO =
  "Consuming proper dietary requirements is critical for maintaining optimal health, growth, and function throughout life. Our body gets energy from the food we eat and the drinks we consume.";

const MORE =
  "The misapplication of vital nutrients can be a problem for healthy individuals and ageing adults alike, as well as for anyone with conditions that call for higher protein needs. That's why MDN builds every formula around clean, verifiable nutrition — no shortcuts, no filler. We test what we ship, and we stand behind the label.";

export default function Hero() {
  const [expanded, setExpanded] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % CYCLE_WORDS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setPhotoIndex((i) => (i + 1) % HERO_PHOTOS.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    // min-h reduced from 85vh -> 75vh (was leaving too much room to fill),
    // and padding made asymmetric — pt smaller, pb bigger — so the
    // items-center-ed content sits higher instead of dead-center of the
    // full section height.
    <section className="relative flex min-h-[75vh] items-center overflow-hidden border-b border-white/5 bg-gradient-to-b from-mdn-charcoal to-mdn-black pt-6 pb-16 sm:pt-8 sm:pb-24">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        {/* Left — copy */}
        <div className="animate-fade-up">
          <span className="inline-block rounded-full border border-mdn-green/40 bg-mdn-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-mdn-green">
            My Daily Nutrition
          </span>

          <h1 className="mt-4 text-3xl font-bold leading-tight text-mdn-white sm:text-4xl lg:text-5xl">
            Best Bodybuilding &amp; <span className="text-mdn-green">Gym Supplements</span> Online
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-mdn-gray sm:text-base">
            {INTRO}
            <span
              className={`grid transition-all duration-500 ease-in-out ${
                expanded ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <span className="overflow-hidden">{MORE}</span>
            </span>
          </p>

          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-2 text-sm font-semibold text-mdn-green transition-colors hover:text-mdn-green-light"
          >
            {expanded ? "Show less ↑" : "Read More →"}
          </button>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="stat-chip">
              <span className="stat-chip-value">26g</span>
              <span className="stat-chip-label">Protein</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-value">5.5g</span>
              <span className="stat-chip-label">BCAA</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-value">0g</span>
              <span className="stat-chip-label">Sugar</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-value">ISO</span>
              <span className="stat-chip-label">Certified</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#best-sellers" className="btn-primary">
              Shop Best Sellers
            </a>
            <a href="#faq" className="btn-secondary">
              Learn More
            </a>
          </div>

          <div className="relative mt-8 flex items-center gap-1.5">
            {CYCLE_WORDS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === wordIndex ? "w-6 bg-mdn-green" : "w-1.5 bg-white/15"
                }`}
              />
            ))}
            <span key={wordIndex} className="ml-3 animate-fade-up text-sm font-bold tracking-wide text-mdn-green">
              {CYCLE_WORDS[wordIndex]}
            </span>
          </div>
        </div>

        {/* Right — hero figure + floating product jars */}
        <div className="relative flex min-h-[420px] w-full items-center justify-center sm:min-h-[520px] lg:min-h-[600px]">
          <div className="absolute h-[420px] w-[420px] animate-[pulse_5s_ease-in-out_infinite] rounded-full bg-mdn-green/25 blur-[110px] sm:h-[520px] sm:w-[520px]" />
          <div className="absolute h-[300px] w-[300px] animate-[pulse_1.8s_ease-in-out_infinite] rounded-full bg-mdn-green/20 blur-[70px] sm:h-[380px] sm:w-[380px]" />

          <div className="relative z-10 flex w-full flex-col items-center justify-center">
            <div className="flex h-[340px] w-full max-w-[88%] items-center justify-center sm:h-[440px] lg:h-[540px]">
              <img
                key={photoIndex}
                src={HERO_PHOTOS[photoIndex]}
                alt="MDN athlete"
                className="animate-fade-up mx-auto h-full w-auto max-w-full object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.6)]"
              />
            </div>
            <GroundGlow width={220} />
          </div>

          <FloatingJar src={mdnP1} className="left-[-2%] top-[2%] h-32 w-32 sm:h-44 sm:w-44 lg:h-52 lg:w-52" />
          <FloatingJar src={mdnP2} className="right-[-2%] top-[8%] h-36 w-36 sm:h-48 sm:w-48 lg:h-56 lg:w-56" />
          <FloatingJar src={mdnP3} className="left-[0%] bottom-[4%] h-36 w-36 sm:h-48 sm:w-48 lg:h-56 lg:w-56" />
          <FloatingJar src={mdnP4} className="right-[-4%] bottom-[-4%] h-32 w-32 sm:h-44 sm:w-44 lg:h-52 lg:w-52" />
        </div>
      </div>
    </section>
  );
}

function GroundGlow({ width = 140 }) {
  return (
    <div
      className="pointer-events-none rounded-full bg-mdn-green/40 blur-xl animate-pulse"
      style={{ width, height: width * 0.24, marginTop: -width * 0.1 }}
    />
  );
}

function FloatingJar({ src, className }) {
  return (
    <div className={`absolute z-20 animate-float ${className}`}>
      <div className="relative flex h-full w-full flex-col items-center">
        <img
          src={src}
          alt="MDN product"
          className="relative h-full w-full object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.65)]"
        />
        <GroundGlow width={70} />
      </div>
    </div>
  );
}