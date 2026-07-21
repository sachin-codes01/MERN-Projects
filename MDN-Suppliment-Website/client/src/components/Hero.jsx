import Carousel from "./Carousel";
import bannerDisciplineDesktop from "../assets/mdn-discipline-whey-2400x1200.png";
import bannerIsolateDesktop from "../assets/mdn-isolate-whey-2400x1200.png";
import bannerMaximumResultsDesktop from "../assets/mdn-maximum-results-2400x1200.png";
import bannerShilajitDesktop from "../assets/mdn-shilajit-2400x1200.png";
import bannerDisciplineMobile from "../assets/mdn-discipline-whey-900x1125.png";
import bannerIsolateMobile from "../assets/mdn-isolate-whey-900x1125.png";
import bannerMaximumResultsMobile from "../assets/mdn-maximum-results-900x1125.png";
import bannerShilajitMobile from "../assets/mdn-shilajit-900x1125.png";

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

export default function Hero() {
  const slides = BANNERS.map((banner, i) => (
    <picture key={i} className="block h-full w-full">
      {/* `lg` (1024px+) matches the same breakpoint the slide/box classes
          below switch on, so the image source and the box shape change
          together. Below that, the <img> fallback (mobile crop) is used. */}
      <source media="(min-width: 1024px)" srcSet={banner.desktop} />
      <img
        src={banner.mobile}
        alt={`MDN promotional banner ${i + 1}`}
        // Mobile/tablet: object-contain — the full poster is always shown,
        // never cropped, inside a normal banner-shaped box (see ratio
        // below).
        // Desktop/laptop (lg+): object-cover — this is the one place a
        // small crop is unavoidable and expected: to truly fill 100% of
        // both the width AND the height of every visitor's differently-
        // shaped screen (the way most full-screen hero sections work),
        // there's no single aspect ratio that fits every monitor without
        // either cropping or leaving empty bars — cropping is what looks
        // intentional here, the same way it does on most sites.
        className="h-full w-full object-contain lg:object-cover"
        draggable={false}
      />
    </picture>
  ));

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden border-b border-white/5 bg-mdn-black">
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
        slideClassName="aspect-[4/5] bg-mdn-charcoal2 lg:aspect-auto lg:h-[85vh]"
      />
    </section>
  );
}
