import Carousel from "./Carousel";
import bannerPNB from "../assets/ONE_July_Banners_PNB.webp";
import bannerPPI from "../assets/ONE_July_Banners_PPI.webp";
import bannerTribulus from "../assets/ONE_July_Banners_Tribulus_2.webp";
import bannerWPI from "../assets/ONE_July_Banners_WPI_1.webp";

const BANNERS = [bannerPNB, bannerPPI, bannerTribulus, bannerWPI];

export default function Hero() {
  const slides = BANNERS.map((src, i) => (
    <img
      key={i}
      src={src}
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
      loading={i === 0 ? "eager" : "lazy"}
      draggable={false}
    />
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
