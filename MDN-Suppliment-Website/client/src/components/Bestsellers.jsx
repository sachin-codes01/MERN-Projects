import ProductCarousel from "./ProductCarousel";

// Reference jaisa tabs — hamare catalogue ke productType / sections ke hisaab se.
// Khaali tab apne aap chhup jata hai. (Module level par, taaki har render pe naya
// array na bane aur fetch dobara na chale.)
const hasType = (...types) => (p) => types.includes(p.productType);
const TABS = [
  {
    key: "best",
    label: "Best Sellers",
    match: (p) => (p.sections || []).includes("best_seller"),
    link: "/products/section/best_seller",
  },
  { key: "protein", label: "Proteins", match: hasType("Whey Protein", "Mass Gainer"), link: "/search?q=protein" },
  { key: "pre", label: "Pre-Workouts", match: hasType("Pre-Workout"), link: "/search?q=pre%20workout" },
  { key: "fat", label: "Fat Burners", match: hasType("Fat Burner"), link: "/search?q=fat%20burner" },
  { key: "amino", label: "Amino & Creatine", match: hasType("Amino Acids", "Creatine"), link: "/search?q=amino" },
  {
    key: "wellness",
    label: "Wellness",
    match: hasType("Liver Support", "Shilajit", "Omega 3", "Multivitamin", "Testosterone Support"),
    link: "/search?q=wellness",
  },
];

const Bestsellers = () => (
  <ProductCarousel
    sectionId="best-sellers"
    className="!pb-5 !pt-6 sm:!pb-10"
    index="04"
    eyebrow="Top rated"
    titleMain="Trusted By"
    titleAccent="500k+ Customers"
    subtitle="Most loved and most reordered by our customers"
    tabs={TABS}
    mobileRows={2}
  />
);

export default Bestsellers;
