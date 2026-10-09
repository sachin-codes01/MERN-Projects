import { useNavigate } from "react-router-dom";
import SectionHeading from "./SectionHeading";
import Reveal from "./motion/Reveal";
// Square product posters (not the transparent cut-outs the navbar uses)
// — these fill the whole card, so no separate artwork or tint is needed.
// NOTE: two files are spelled "Protines"/"isolete" on disk.
import proteinImg from "../assets/Protines.jpeg";
import creatineImg from "../assets/creatine.jpeg";
import isolateImg from "../assets/isolete.jpeg";
import collagenImg from "../assets/Collagen.jpeg";
import ImageTile from "./ImageTile";
import ViewAllLink from "./ViewAllLink";
import CategoryRail from "./CategoryRail";

// Chaar collections — har ek ka apna square poster.
const COLLECTIONS = [
  { title: "Protein", to: "/search?q=whey%20protein", image: proteinImg },
  { title: "Creatine", to: "/search?q=creatine", image: creatineImg },
  { title: "Isolate", to: "/search?q=isolate", image: isolateImg },
  { title: "Collagen", to: "/search?q=collagen", image: collagenImg },
];

// "Shop by Collection" — reference ke "What's Your Target?" jaisa layout:
// left heading + "View all", aur image tiles jin par title + Shop pill.
const CategoryMoves = () => {
  const navigate = useNavigate();

  return (
    <section className="section">
      <SectionHeading
        align="left"
        eyebrow="Explore"
        title="Shop by"
        accent="Collection"
        subtitle="Pick a collection to see every product in it"
        action={<ViewAllLink to="/products" />}
      />

      {/* Static grid — 2 per row on phones, 4 across from lg */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-4 sm:gap-4">
        {COLLECTIONS.map((c, i) => (
          <Reveal key={c.title} from="up" delay={i * 0.08} amount={0.3}>
            <ImageTile title={c.title} image={c.image} ratio="aspect-[5/6] sm:aspect-square" imgClassName="object-cover" onClick={() => navigate(c.to)} />
          </Reveal>
        ))}
      </div>

      {/* Saari categories ki icon row — collection cards ke theek neeche,
          halki "Browse by category" line ke saath, taaki dono ek hi shopping block lagein */}
      {/* Phone pe yeh row hero me trust chips ke neeche dikhti hai — yahan sirf tablet/desktop */}
      <div className="mt-8 hidden sm:mt-10 md:block">
        <div className="flex items-center gap-3">
          <span className="eyebrow flex-shrink-0">Browse by category</span>
          <span aria-hidden="true" className="h-px flex-1 bg-mdn-border-strong" />
        </div>
        <CategoryRail className="mt-1" />
      </div>
    </section>
  );
};

export default CategoryMoves;
