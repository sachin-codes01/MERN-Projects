import SectionHeading from "./SectionHeading";
import img1Mobile from "../assets/343×224px.png";
import img1Tablet from "../assets/592×288px.png";
import img1Desktop from "../assets/315×464px.png";
import img2 from "../assets/Artboard_3onecards_1.png";
import img3 from "../assets/Artboard_4onecards_1.avif";
import img4 from "../assets/Artboard_5onecards.avif";
import img5 from "../assets/Artboard_6onecards_1.png";

const TILE_CLASS =
  "card h-40 overflow-hidden bg-mdn-charcoal2 transition-all duration-300 hover:-translate-y-1 hover:border-mdn-green/40 hover:shadow-green-glow sm:h-48 lg:h-56";

export default function WhyOne() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
      <SectionHeading title="WHY" accent="One" subtitle="One ingredient. Zero compromise." />

      {/* The 4 small tiles live in their own self-contained 2x2 grid, and
          the outer grid places two items side by side at `lg`: the big
          tile and that whole small-tile block.

          The big tile's height at `lg` is hardcoded to the EXACT pixel
          total of the two small-tile rows stacked together:
            small tile height (lg:h-56 = 224px) x 2 + gap (gap-4 = 16px)
            = 464px
          This is deliberate, not a stretch/auto trick — with an auto
          height, the card has nothing forcing its size, so it ends up
          sizing itself off the raw image's own (tall) aspect ratio
          instead of matching the small tiles, which was the visible gap.
          If you change the small tile height or gap below, update this
          number to match (new total = tileHeight × 2 + gap). */}
      <div className="mt-10 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <div className="card h-56 overflow-hidden bg-mdn-charcoal2 transition-all duration-300 hover:-translate-y-1 hover:border-mdn-green/40 hover:shadow-green-glow sm:h-72 lg:h-[464px]">
          {/* object-fill stretches each crop to the box's exact
              dimensions — whole poster visible, no cropping, and no side
              gaps either. */}
          <picture>
            <source media="(min-width: 1024px)" srcSet={img1Desktop} />
            <source media="(min-width: 640px)" srcSet={img1Tablet} />
            <img
              src={img1Mobile}
              alt="MDN ONE — why choose us"
              className="h-full w-full object-fill"
            />
          </picture>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-2">
          {[img2, img3, img4, img5].map((src, i) => (
            <div key={i} className={TILE_CLASS}>
              <img
                src={src}
                alt="MDN ONE — why choose us"
                className={`h-full w-full ${src === img3 ? "object-contain" : "object-fill"}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
