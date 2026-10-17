import allProductsImg from "../assets/All Products.png";
import wheyProteinImg from "../assets/Whey Protein.png";
import newLaunchesImg from "../assets/New Launches.png";
import veganProteinImg from "../assets/Vegan Protein.png";
import aminoAcidsImg from "../assets/Amino Acids.png";
import peanutButterImg from "../assets/Peanut Butter.png";
import supplementsImg from "../assets/Supplements.png";
import combosImg from "../assets/Combos.png";
import accessoriesImg from "../assets/Accessories.png";

// Site ke saare "shop by category" links ek jagah — Navbar ka mega-menu,
// mobile drawer aur category row/cards sab yahi list use karte hain.
// `tagline`: phone ke category cards me naam ke neeche ki chhoti line.
export const SHOP_CATEGORIES = [
  { label: "All Products", to: "/products", image: allProductsImg, tagline: "Everything we make" },
  { label: "Whey Protein", to: "/search?q=whey%20protein", image: wheyProteinImg, tagline: "Build lean muscle" },
  { label: "New Launches", to: "/products/section/new_arrival", image: newLaunchesImg, tagline: "Just dropped" },
  { label: "Vegan Protein", to: "/search?q=vegan%20protein", image: veganProteinImg, tagline: "Plant powered" },
  { label: "Amino Acids", to: "/search?q=amino%20acids", image: aminoAcidsImg, tagline: "Faster recovery" },
  { label: "Peanut Butter", to: "/search?q=peanut%20butter", image: peanutButterImg, tagline: "Clean protein snack" },
  { label: "Supplements", to: "/search?q=supplements", image: supplementsImg, tagline: "Overall wellness" },
  { label: "Combos", to: "/products/section/fitness_combo", image: combosImg, tagline: "Save on stacks" },
  { label: "Accessories", to: "/search?q=accessories", image: accessoriesImg, tagline: "Train smarter" },
];
