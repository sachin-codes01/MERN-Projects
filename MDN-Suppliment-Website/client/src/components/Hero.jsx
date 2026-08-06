import Carousel from "./Carousel";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import HeadsetMicOutlinedIcon from "@mui/icons-material/HeadsetMicOutlined";
import bannerDisciplineDesktop from "../assets/mdn-discipline-whey-2400x1200.png";
import bannerIsolateDesktop from "../assets/mdn-isolate-whey-2400x1200.jpg";
import bannerMaximumResultsDesktop from "../assets/mdn-maximum-results-2400x1200.jpg";
import bannerShilajitDesktop from "../assets/mdn-shilajit-2400x1200.jpeg";
import bannerDisciplineMobile from "../assets/mdn-discipline-whey-900x1125.png";
import bannerIsolateMobile from "../assets/mdn-isolate-whey-900x1125.png";
import bannerMaximumResultsMobile from "../assets/mdn-maximum-results-900x1125.png";
import bannerShilajitMobile from "../assets/mdn-creatine-375×469px.png";

// Each banner ships two crops: a 4:5 "mobile" poster (900x1125) and a wide
// "desktop" one (2400x1200) — see the `<picture>` below for which shows
// where. Keeping both lets small screens skip downloading the much
// heavier desktop image entirely.
const BANNERS = [
  { mobile: bannerDisciplineMobile, desktop: bannerDisciplineDesktop },
  { mobile: bannerIsolateMobile, desktop: bannerIsolateDesktop },
  { mobile: bannerMaximumResultsMobile, desktop: bannerMaximumResultsDesktop },
  { mobile: bannerShilajitMobile, desktop: bannerShilajitDesktop },
];

// The five reassurances shown in the panel over the banner's bottom edge.
// Split into `value` (the number/short claim, set large) and `label` (what
// it refers to, set small and uppercase) so the row scans as five figures
// rather than five sentences.
const TRUST_ITEMS = [
  { value: "11+", label: "Happy Customers", Icon: PersonOutlineRoundedIcon },
  { value: "50K+", label: "Orders Delivered", Icon: Inventory2OutlinedIcon },
  { value: "Fast", label: "& Safe Delivery", Icon: LocalShippingOutlinedIcon },
  { value: "100%", label: "Secure Payment", Icon: LockOutlinedIcon },
  { value: "24/7", label: "Customer Support", Icon: HeadsetMicOutlinedIcon },
];

export default function Hero() {
  const slides = BANNERS.map((banner, i) => (
    <picture key={i} className="block h-full w-full">
      {/* `lg` (1024px+) matches the same breakpoint the slide/box classes
          below switch on, so the image source and the box shape change
          together. Below that, the <img> fallback (mobile crop) is used. */}
      <source media="(min-width: 1025px)" srcSet={banner.desktop} />
      <img
        src={banner.mobile}
        alt={`MDN promotional banner ${i + 1}`}
        // object-cover on every breakpoint: the exported poster files
        // don't land on the box's exact aspect ratio pixel-for-pixel, so
        // object-contain was leaving thin white bars above/below on
        // mobile. Cover always fills the box completely (tiny edge crop,
        // never visible letterboxing) instead.
        className="h-full w-full object-cover"
        draggable={false}
      />
    </picture>
  ));

  return (
    <section className="relative">
      {/* Banner — still full-bleed, but its BOTTOM corners are curved so
          the artwork ends on a soft edge rather than a hard rule, per the
          reference. `overflow-hidden` is what actually clips the carousel
          images to that radius; without it the radius sits on the box and
          the image corners still square it off.

          The radius scales up with the viewport: a 32px curve that reads
          as a deliberate sweep on a phone looks like a rounding error
          across a 1536px banner. */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden rounded-b-[28px] bg-mdn-black sm:rounded-b-[40px] lg:rounded-b-[56px]">
        <Carousel
          slides={slides}
          autoPlay
          interval={4000}
          showDots={false}
          pauseOnHover={false}
          // Mobile/tablet: a normal banner-shaped box (aspect-ratio-based),
          // matching how most sites treat hero carousels on smaller screens
          // — export new mobile/tablet posters at this ratio (e.g. 900 x
          // 1125 px) so they show in full with no letterboxing.
          //
          // Desktop/laptop (lg and up, 1024px+): the aspect ratio is
          // dropped in favor of a fixed viewport-relative height, so the
          // poster runs full width AND fills most of the screen's height —
          // adjust the 85vh below (e.g. to 90vh or 100vh) if you want it
          // taller or shorter.
          slideClassName="aspect-[4/5] bg-mdn-charcoal2 lg:aspect-auto lg:h-[84.6vh]"
        />
      </div>

      <HeroTrustBar />
    </section>
  );
}

// Trust bar — the cream panel that straddles the banner's lower edge.
//
// It is a SIBLING of the banner, not a child: the banner needs
// `overflow-hidden` to clip its own rounded corners, and anything nested
// inside that would be clipped the moment it overhangs. Pulling it up
// with a negative margin instead lets it sit half on the artwork and half
// on the page, which is the effect in the reference.
//
// The overhang shrinks on small screens — the panel grows to three rows
// there, and a large negative margin would bury the banner behind it.
//
// Overhang is 9px — a shallow tuck, not a real overlap. The reference
// has the panel's top edge essentially flush with the banner's bottom
// (banner ends y=392, panel starts y=393); this sits a few pixels
// higher so the panel visibly laps the curve while its body still
// stands clear on the page. An earlier version overlapped by half the
// panel's height, which put the banner's bottom edge straight through
// its centre.
function HeroTrustBar() {
  return (
    <div className="relative z-10 mx-auto -mt-[14px] max-w-shell px-4 sm:px-6 lg:px-[34px]">
      <div className="rounded-2xl border border-mdn-border bg-mdn-sand px-3 py-5 shadow-lg sm:px-6 sm:py-6">
        {/* 2 cols on phones, 3 on small tablets, all 5 in a row from lg.
            Five equal columns squeezed onto a phone would clip the longer
            labels ("Orders Delivered", "Customer Support"). */}
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5">
          {TRUST_ITEMS.map(({ value, label, Icon }) => (
            <li key={label} className="flex items-center justify-center gap-2.5 sm:gap-3">
              <Icon
                aria-hidden="true"
                className="shrink-0 text-mdn-green"
                sx={{ fontSize: 30 }}
              />
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-none text-mdn-ink sm:text-lg">{value}</p>
                <p className="mt-1 text-[10px] font-medium uppercase leading-tight tracking-wider text-mdn-ink-muted sm:text-[11px]">
                  {label}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
