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
// mobile drawer aur Hero ke neeche wali category row teeno yahi list use karte hain.
export const SHOP_CATEGORIES = [
  { label: "All Products", to: "/products", image: allProductsImg },
  { label: "Whey Protein", to: "/search?q=whey%20protein", image: wheyProteinImg },
  { label: "New Launches", to: "/products/section/new_arrival", image: newLaunchesImg },
  { label: "Vegan Protein", to: "/search?q=vegan%20protein", image: veganProteinImg },
  { label: "Amino Acids", to: "/search?q=amino%20acids", image: aminoAcidsImg },
  { label: "Peanut Butter", to: "/search?q=peanut%20butter", image: peanutButterImg },
  { label: "Supplements", to: "/search?q=supplements", image: supplementsImg },
  { label: "Combos", to: "/products/section/fitness_combo", image: combosImg },
  { label: "Accessories", to: "/search?q=accessories", image: accessoriesImg },
];
