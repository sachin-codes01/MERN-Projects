import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { EASE_OUT_QUINT, EASE_OUT_EXPO } from "../lib/easings";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import HeadsetMicOutlinedIcon from "@mui/icons-material/HeadsetMicOutlined";
import bannerVideo from "../assets/mdn-hero-banner.mp4";
import mobileBannerVideo from "../assets/banner for mobile.mp4";
import collagenVideo from "../assets/1-video.mp4";
import preWorkoutVideo from "../assets/2nd video.mp4";
import wheyVideo from "../assets/3rd video.mp4";
import wellnessVideo from "../assets/4th video.mp4";
import { useMediaQuery } from "../hooks/useMediaQuery";
import CategoryRail from "./CategoryRail";

// Phone banner ke 5 portrait (9:16) videos — ek ke baad ek auto-scroll.
const MOBILE_SLIDES = [mobileBannerVideo, collagenVideo, preWorkoutVideo, wheyVideo, wellnessVideo];

// Banner ke neeche wali trust row ke paanch points.
const TRUST_ITEMS = [
  { value: "11+", label: "Happy Customers", Icon: PersonOutlineRoundedIcon },
  { value: "50K+", label: "Orders Delivered", Icon: Inventory2OutlinedIcon },
  { value: "Fast", label: "& Safe Delivery", Icon: LocalShippingOutlinedIcon },
  { value: "100%", label: "Secure Payment", Icon: LockOutlinedIcon },
  { value: "24/7", label: "Customer Support", Icon: HeadsetMicOutlinedIcon },
];

// Hero entrance ka sequence: banner → trust chips (ek-ek karke).
// Sab mount pe chalta hai (scroll pe nahi), aur stagger se ek-ek karke aata hai.
const rise = (delay, y = 14) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: EASE_OUT_QUINT },
});

const Hero = () => {
  // Phone pe portrait video (478x850), tablet/desktop pe landscape (16:9).
  // Ek hi <video> render hota hai — dono ek saath load nahi hote.
  const isMobile = useMediaQuery("(max-width: 767px)");
  // Portrait tablet pe 16:9 video ko window-height tak kheenchna use bahut
  // pichka deta — wahan banner apne natural 16:9 shape me rehta hai.
  const isPortraitTablet = useMediaQuery("(min-width: 768px) and (orientation: portrait)");
  const fitWindow = !isPortraitTablet;

  // Mouse banner pe aaye to video ruke, hate to phir chale. Sirf asli mouse
  // (hover: hover) pe — phone pe tap se video atakna nahi chahiye.
  const videoRef = useRef(null);
  const canHover = useMediaQuery("(hover: hover)");
  const pauseVideo = () => canHover && videoRef.current?.pause();
  const playVideo = () => {
    if (!canHover || !videoRef.current) return;
    // play() promise reject ho sakta hai (e.g. tab background me) — ignore
    videoRef.current.play().catch(() => {});
  };

  return (
    <section className="relative mx-auto max-w-shell px-4 sm:px-6 lg:px-[34px]">
      {/* Banner ke neeche halki brand glow — sirf desktop, static (koi loop nahi) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[8%] bottom-[10%] -z-10 hidden h-56 bg-[radial-gradient(ellipse_at_center,rgb(var(--green-mid)/0.16),transparent_70%)] lg:block"
      />

      {/* Banner + trust row milke ek window ki height lete hain (navbar ke neeche),
          taaki trust row hamesha first screen ke bottom pe dikhe. Banner bachi
          hui jagah bharta hai aur video usme stretch hota hai (crop nahi). */}
      <div
        className={`flex flex-col pb-1 pt-3 sm:pb-4 sm:pt-4 ${
          fitWindow ? "h-[calc(100svh-var(--nav-h,72px))] min-h-[420px]" : ""
        }`}
      >
        {/* Reference jaisa inset banner — halka zoom-out ke saath settle hota hai */}
        <motion.div
          initial={{ opacity: 0.4, scale: 1.025 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
          className="relative min-h-0 flex-1 rounded-[18px] bg-mdn-charcoal2 shadow-lg sm:rounded-[24px]"
        >
          {/* Video ki rounded clipping alag GPU layer pe — warna scroll karte waqt
              Chrome me rounded corners wala video flicker karta tha. */}
          {/* Poora banner clickable — products page pe le jata hai (Shop Now button hata diya) */}
          <Link
            to="/products"
            aria-label="Shop all products"
            className="relative block h-full cursor-pointer overflow-hidden rounded-[inherit]"
            onMouseEnter={pauseVideo}
            onMouseLeave={playVideo}
            style={{ transform: "translateZ(0)" }}
          >
            {isMobile ? (
              // Phone: 5 videos ka slider — har video khatam hote hi agla, swipe bhi
              <MobileBannerSlider fit={fitWindow} />
            ) : (
              <video
                ref={videoRef}
                src={bannerVideo}
                // Autoplay ke liye muted + playsInline zaroori hain.
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label="MDN promotional banner"
                className={fitWindow ? "block h-full w-full object-fill" : "block aspect-video w-full object-cover"}
              />
            )}
          </Link>
        </motion.div>

        <HeroTrustRow />
        {/* Sirf phone pe: category icon row trust chips ke neeche, isi viewport block
            me — banner flex-1 hai isliye apne aap chhota ho jata hai aur sab
            pehli screen me fit hota hai. Desktop pe yeh "Shop by Collection" me hai. */}
        <CategoryRail className="flex-shrink-0 !pb-2 !pt-3 md:hidden" />
      </div>
    </section>
  );
};

// Phone banner slider: native swipe (scroll-snap) + auto-advance. Sirf active
// video chalta hai; baaki ruke rehte hain (aur shuru pe wapas). Video khatam
// hote hi agla slide. Infinite loop: aakhir me pehle video ki ek copy hai —
// 5th ke baad slider aage hi badhta hai (copy pe), phir chupke se asli 1st pe
// aa jata hai. Isliye peeche ki taraf rewind hota nahi dikhta.
const SLIDE_COUNT = MOBILE_SLIDES.length;
const LOOP_SLIDES = [...MOBILE_SLIDES, MOBILE_SLIDES[0]];

const MobileBannerSlider = ({ fit }) => {
  const trackRef = useRef(null);
  const videoRefs = useRef([]);
  const settleTimer = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) {
        // Browser sirf muted video ko khud chalne deta hai — play se pehle pakka muted
        v.muted = true;
        // Pehle khatam ho chuka video ho to shuru se chalao
        if (v.ended) v.currentTime = 0.1;
        v.play().catch(() => {});
      } else {
        v.pause();
        v.currentTime = 0.1;
      }
    });
  }, [active]);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  // Scroll rukne ke baad hi decide karo kaun sa slide samne hai — beech ke
  // slides (smooth scroll ke dauran) ignore ho jate hain.
  const settle = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    let i = Math.round(el.scrollLeft / el.clientWidth);
    if (i >= SLIDE_COUNT) {
      // Copy pe pahunch gaye — bina animation asli 1st slide pe (dikhta same hai)
      el.scrollLeft = 0;
      i = 0;
    }
    setActive(i);
  };

  const onScroll = () => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, 120);
  };

  const goTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative h-full">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className={`no-scrollbar flex snap-x snap-mandatory overflow-x-auto ${fit ? "h-full" : ""}`}
      >
        {LOOP_SLIDES.map((src, i) => {
          const isCopy = i === SLIDE_COUNT;
          return (
            <video
              key={i}
              ref={(el) => (videoRefs.current[i] = el)}
              // #t=0.1 — play se pehle bhi pehla frame dikhe
              src={`${src}#t=0.1`}
              muted
              playsInline
              autoPlay={i === 0}
              preload={i === 0 ? "auto" : "metadata"}
              onEnded={() => goTo(i + 1)}
              aria-hidden={isCopy || undefined}
              aria-label={isCopy ? undefined : `MDN promotional video ${i + 1}`}
              className={`block w-full flex-shrink-0 snap-start snap-always object-fill ${
                fit ? "h-full" : "aspect-[478/850]"
              }`}
            />
          );
        })}
      </div>

      {/* Chhote dots — kaun sa video chal raha hai */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {MOBILE_SLIDES.map((src, i) => (
          <span
            key={src}
            className={`h-1.5 rounded-full bg-white shadow transition-all duration-300 ${
              i === active ? "w-5 opacity-100" : "w-1.5 opacity-60"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Slim trust row — mobile pe horizontal scroll, desktop pe ek line me paanchon.
const HeroTrustRow = () => (
  <ul
    className="no-scrollbar -mx-4 mt-3 flex flex-shrink-0 snap-x scroll-px-4 gap-2 overflow-x-auto px-4 sm:-mx-6 sm:mt-4 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-3 lg:overflow-visible lg:px-0"
  >
    {TRUST_ITEMS.map(({ value, label, Icon }, i) => (
      <motion.li
        key={label}
        {...rise(0.6 + i * 0.07, 10)}
        className="flex flex-shrink-0 snap-start items-center gap-2.5 rounded-full border border-mdn-border bg-mdn-charcoal py-2 pl-2 pr-5 shadow-xs lg:justify-center"
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-mdn-green-soft text-mdn-green">
          <Icon aria-hidden="true" sx={{ fontSize: 22 }} />
        </span>
        <span className="whitespace-nowrap font-heading text-sm font-semibold leading-tight text-mdn-ink-body sm:text-[15px]">
          <strong className="font-extrabold text-mdn-ink">{value}</strong> {label}
        </span>
      </motion.li>
    ))}
  </ul>
);

export default Hero;
