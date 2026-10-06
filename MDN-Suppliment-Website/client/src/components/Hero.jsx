import { useRef } from "react";
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
import { useMediaQuery } from "../hooks/useMediaQuery";
import { SHOP_CATEGORIES } from "../data/shopCategories";

// Banner ke neeche wali trust row ke paanch points.
const TRUST_ITEMS = [
  { value: "11+", label: "Happy Customers", Icon: PersonOutlineRoundedIcon },
  { value: "50K+", label: "Orders Delivered", Icon: Inventory2OutlinedIcon },
  { value: "Fast", label: "& Safe Delivery", Icon: LocalShippingOutlinedIcon },
  { value: "100%", label: "Secure Payment", Icon: LockOutlinedIcon },
  { value: "24/7", label: "Customer Support", Icon: HeadsetMicOutlinedIcon },
];

// Hero entrance ka sequence: banner → Shop Now → trust chips → categories.
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
        className={`flex flex-col pb-3 pt-3 sm:pb-4 sm:pt-4 ${
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
          <div
            className="relative h-full overflow-hidden rounded-[inherit]"
            onMouseEnter={pauseVideo}
            onMouseLeave={playVideo}
            style={{ transform: "translateZ(0)" }}
          >
            <video
              ref={videoRef}
              key={isMobile ? "mobile" : "desktop"}
              src={isMobile ? mobileBannerVideo : bannerVideo}
              // Mobile pe autoplay ke liye muted + playsInline zaroori hain.
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label="MDN promotional banner"
              className={fitWindow ? "block h-full w-full object-fill" : "block aspect-video w-full object-cover"}
            />

            {/* "Shop Now" pill — banner ke bottom-left pe, reference jaisa */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/45 via-black/10 to-transparent p-4 pt-16 sm:p-6 sm:pt-20 md:bg-none lg:p-8">
              <motion.div {...rise(0.45, 18)} className="pointer-events-auto">
                <Link
                  to="/products"
                  className="btn-shine press group inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 font-heading text-sm font-semibold text-[#241f1a] shadow-lg transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:px-6 sm:py-3"
                >
                  Shop Now
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <HeroTrustRow />
      </div>
      <HeroCategoryRail />
    </section>
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

// Reference ka category icon row (Winter Arc / Build / Wellness ...) —
// hamare apne shop categories ke saath. Mobile pe swipe hota hai.
const HeroCategoryRail = () => (
  <nav aria-label="Shop by category" className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-5 pt-2 sm:-mx-6 sm:px-6 sm:pt-3">
    {/* overflow-x-auto vertical bhi clip karta hai — pt/pb ki jagah hover lift (-4px)
        aur shadow ko kaatne se bachati hai.
        w-max + mx-auto: jagah ho to row centre me, kam ho to pehle item se scroll (clip nahi) */}
    <ul className="mx-auto flex w-max gap-3 sm:gap-4 xl:gap-5">
      {SHOP_CATEGORIES.map((c, i) => (
        <motion.li key={c.label} {...rise(0.8 + i * 0.04, 10)} className="flex-shrink-0">
          <Link to={c.to} className="group flex w-[80px] flex-col items-center gap-2 sm:w-[100px] xl:w-[118px]">
            <span className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl border border-mdn-border-strong/70 bg-mdn-charcoal shadow-xs transition-[transform,box-shadow,border-color] duration-300 ease-brand-out group-hover:-translate-y-1 group-hover:border-mdn-green/50 group-hover:shadow-lg group-active:scale-95 sm:h-[88px] sm:w-[88px] xl:h-[104px] xl:w-[104px]">
              <img
                src={c.image}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="h-[88%] w-[88%] object-contain transition-transform duration-500 ease-brand-out group-hover:scale-110"
              />
            </span>
            <span className="text-center font-heading text-[12.5px] font-bold leading-tight text-mdn-ink transition-colors group-hover:text-mdn-green sm:text-[14px] xl:text-[15px]">
              {c.label}
            </span>
          </Link>
        </motion.li>
      ))}
    </ul>
  </nav>
);

export default Hero;
