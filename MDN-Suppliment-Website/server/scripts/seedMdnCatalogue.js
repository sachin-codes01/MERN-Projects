/**
 * Replaces the product catalogue with MDN's real range, built from the
 * product photography and pack labels supplied by the store owner.
 *
 * DESTRUCTIVE: deletes every existing product first (requested), and pulls
 * those products out of any live cart so no cart is left holding a
 * dangling reference. Past ORDERS are untouched — Order.items keeps its
 * own snapshot of name/price/image, so order history still renders.
 *
 * Categories are upserted by slug, never deleted.
 *
 *   node scripts/seedMdnCatalogue.js --dry   # report only, no writes
 *   node scripts/seedMdnCatalogue.js         # apply
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../database");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

const DRY = process.argv.includes("--dry");
const IMG = (f) => `/mdn/${f}`;
const FLV = (f) => `/flavours/${f}`;
const MFG = new Date("2026-04-01");
const EXP = new Date("2028-04-01");
const POSTER_TOP = IMG("poster-wide.jpg");
const POSTER_BOTTOM = IMG("poster-brand.jpg");

const WARN =
  "Not for medicinal use. Not recommended for persons under 18, or for pregnant or breastfeeding women. " +
  "Consult a qualified healthcare professional before use if you are on medication or have a medical condition. " +
  "Do not exceed the recommended daily dosage. Store in a cool, dry place away from direct sunlight.";

const CATEGORIES = [
  { name: "Whey Protein", slug: "whey-protein" },
  { name: "Mass Gainer", slug: "mass-gainer" },
  { name: "Creatine", slug: "creatine" },
  { name: "Pre-Workout", slug: "pre-workout" },
  { name: "Amino Acids", slug: "amino-acids" },
  { name: "Fat Burner", slug: "fat-burner" },
  { name: "Wellness", slug: "wellness" },
];

// The six flavour swatches supplied. `priceAdjustment` varies so the PDP's
// live price-per-flavour behaviour is actually exercised.
const F = {
  chocolate: { name: "Chocolate", image: FLV("chocolate.webp"), priceAdjustment: 0 },
  vanilla: { name: "Vanilla", image: FLV("vanilla.webp"), priceAdjustment: 0 },
  coffee: { name: "Coffee", image: FLV("coffee.webp"), priceAdjustment: 50 },
  mango: { name: "Mango", image: FLV("mango.webp"), priceAdjustment: 50 },
  rasmalai: { name: "Rasmalai", image: FLV("rasmalai.webp"), priceAdjustment: 100 },
  kesar: { name: "Kesar Pista", image: FLV("kesar-pista.webp"), priceAdjustment: 100 },
};
const ALL6 = [F.chocolate, F.vanilla, F.coffee, F.mango, F.rasmalai, F.kesar];
const FIVE = [F.chocolate, F.vanilla, F.coffee, F.rasmalai, F.kesar];
const FOUR = [F.chocolate, F.vanilla, F.mango, F.coffee];

// Every product gets exactly four sizes. `mk` keeps that shape honest and
// derives the discount + SKU rather than hand-typing 68 of each.
const mk = (sku, rows) =>
  rows.map(([weight, price, discountPrice, stock, servings, supplyLabel], i) => ({
    weight,
    price,
    discountPrice,
    stock,
    servings,
    supplyLabel,
    sku: `${sku}-${String(i + 1).padStart(2, "0")}`,
  }));

const P = [
  {
    slug: "whey-protein",
    name: "MDN Whey Protein",
    categorySlug: "whey-protein",
    productType: "Whey Protein",
    sections: ["best_seller", "new_arrival"],
    shortDescription: "24g protein per 35g scoop with added digestive enzymes, L-glutamine and vitamin D.",
    description:
      "MDN Whey Protein blends whey protein isolate and concentrate for a clean 24g of protein per scoop. A multi-enzyme complex (amylase, lipase, protease) plus prebiotic dietary fibre keeps it easy on digestion, and every batch adds L-glutamine and vitamin D for recovery and bone support. Mixes smooth in 200ml of water or milk with no clumping.",
    images: ["whey-front.jpg", "whey-back.jpg"],
    sizes: mk("MDN-WHY", [
      ["500g", 1899, 1499, 120, 14, "2-week supply"],
      ["1kg", 3499, 2699, 180, 28, "1-month supply"],
      ["2kg", 6499, 4999, 90, 57, "2-month supply"],
      ["4kg", 11999, 8999, 40, 114, "4-month supply"],
    ]),
    flavors: ALL6,
    nutrition: { servingSize: "35g (1 heaped scoop)", servingsPerContainer: 28, calories: 118, protein: 24, carbs: 3.1, fats: 0, sugar: 0,
      otherNutrients: [{ name: "Digestive Enzyme Complex", amount: "50mg" }, { name: "L-Glutamine", amount: "320mg" }, { name: "Vitamin D", amount: "600 IU" }] },
    nutritionHighlights: [{ label: "Kcal", value: "118" }, { label: "Protein", value: "24Gms" }, { label: "Carbs", value: "3.1G" }, { label: "Added Sugar", value: "0G" }, { label: "Protein %", value: "68%" }],
    benefits: [
      { text: "Fast-absorbing for quick recovery", icon: "bolt" },
      { text: "Supports lean muscle growth", icon: "muscle" },
      { text: "Added digestive enzymes", icon: "leaf" },
      { text: "Available in six tasty flavours", icon: "heart" },
    ],
    ingredients: "Whey Protein Isolate, Whey Protein Concentrate, Cocoa Powder (processed with alkali), Vitamin D3 (Ergocalciferol), L-Glutamine, Digestive Enzyme Complex (Amylase, Lipase, Protease), Prebiotic Dietary Fibre (Fructo-Oligosaccharide), Sodium Chloride, Emulsifier (INS 466, INS 322i), Permitted Artificial Sweetener (INS 955) and Flavour.",
    directionsOfUse: "Mix 1 heaped scoop (35g) into 200ml of water, milk, coconut water or fruit juice. Shake or blend until fully mixed and consume immediately. Best taken after training, or as a mid-morning snack. Maximum 2 servings per day.",
    whoIsThisFor: "Anyone training regularly who needs a convenient, high-quality protein top-up alongside meals — from first-timers through to advanced lifters.",
    goal: ["muscle_gain", "recovery"],
    dietaryTags: ["vegetarian", "gluten_free"],
    tags: ["whey", "protein", "whey protein", "muscle", "recovery"],
  },
  {
    slug: "whey-protein-isolate",
    name: "MDN Whey Protein Isolate",
    categorySlug: "whey-protein",
    productType: "Whey Protein",
    sections: ["best_seller"],
    shortDescription: "26g protein per 33g scoop, only 0.3g carbs and zero added sugar.",
    description:
      "A pure isolate for anyone who wants protein without the extras. 26g of protein from a 33g scoop, just 0.3g of carbohydrate and 0.3g of fat, with a multi-enzyme complex for easy digestion. Gentler on the stomach than a concentrate, which makes it the pick if dairy usually sits heavily.",
    images: ["isolate-back.jpg", "whey-front.jpg"],
    sizes: mk("MDN-ISO", [
      ["500g", 2299, 1799, 100, 15, "2-week supply"],
      ["1kg", 4199, 3299, 150, 30, "1-month supply"],
      ["2kg", 7999, 5999, 70, 60, "2-month supply"],
      ["4kg", 14999, 11499, 30, 121, "4-month supply"],
    ]),
    flavors: FIVE,
    nutrition: { servingSize: "33g (1 scoop)", servingsPerContainer: 60, calories: 109, protein: 26, carbs: 0.3, fats: 0.3, sugar: 0,
      otherNutrients: [{ name: "Multi Enzyme Complex", amount: "99mg" }, { name: "Sodium", amount: "300mg" }] },
    nutritionHighlights: [{ label: "Kcal", value: "109" }, { label: "Protein", value: "26Gms" }, { label: "Carbs", value: "0.3G" }, { label: "Fat", value: "0.3G" }, { label: "Protein %", value: "79%" }],
    benefits: [
      { text: "Ultra-filtered whey isolate", icon: "shield" },
      { text: "Only 0.3g carbs per serving", icon: "drop" },
      { text: "Easier on digestion", icon: "leaf" },
      { text: "Zero added sugar", icon: "check" },
    ],
    ingredients: "Whey Protein Isolate, Multi Enzyme Complex (Amylase, Lipase, Protease), Dietary Fibre (Fructo-Oligosaccharide), Sodium Chloride, Emulsifier (INS 466, INS 322i), Permitted Artificial Sweetener (INS 950, INS 955) and Flavour.",
    directionsOfUse: "Mix 1 scoop (33g) into 150ml–180ml of low fat milk, coconut water, plain water or fruit juice and consume immediately. 1–2 servings daily depending on your protein target.",
    whoIsThisFor: "Lifters cutting or tracking macros closely, and anyone who finds regular whey concentrate heavy on digestion.",
    goal: ["muscle_gain", "weight_loss"],
    dietaryTags: ["vegetarian", "gluten_free"],
    tags: ["isolate", "whey isolate", "protein", "low carb"],
  },
  {
    slug: "lean-whey-protein",
    name: "MDN Lean Whey Protein",
    categorySlug: "whey-protein",
    productType: "Whey Protein",
    sections: ["new_arrival"],
    shortDescription: "24g protein per 30g scoop with garcinia, green tea, green coffee and L-carnitine.",
    description:
      "Whey isolate with a fat-metabolism blend built in — garcinia cambogia, green tea, green coffee and L-carnitine alongside 24g of protein per scoop. Added papain and L-glutamine round it out. Made for a cut, where protein needs to stay high while calories come down.",
    images: ["leanwhey-back.jpg", "whey-front.jpg"],
    sizes: mk("MDN-LWH", [
      ["500g", 2199, 1699, 90, 16, "2-week supply"],
      ["1kg", 3999, 3099, 130, 33, "1-month supply"],
      ["2kg", 7499, 5699, 60, 66, "2-month supply"],
      ["4kg", 13999, 10499, 25, 133, "4-month supply"],
    ]),
    flavors: FIVE,
    nutrition: { servingSize: "30g (1 scoop)", servingsPerContainer: 66, calories: 104, protein: 24, carbs: 0.9, fats: 0, sugar: 0,
      otherNutrients: [{ name: "L-Glutamine", amount: "600.6mg" }, { name: "L-Carnitine LT", amount: "600.6mg" }, { name: "Garcinia Cambogia", amount: "60mg" }, { name: "Green Tea Extract", amount: "60mg" }, { name: "Papain", amount: "90mg" }] },
    nutritionHighlights: [{ label: "Kcal", value: "104" }, { label: "Protein", value: "24Gms" }, { label: "Carbs", value: "0.9G" }, { label: "L-Carnitine", value: "600mg" }, { label: "Protein %", value: "80%" }],
    benefits: [
      { text: "Protein with a fat-metabolism blend", icon: "flask" },
      { text: "Supports lean muscle on a cut", icon: "muscle" },
      { text: "Added L-carnitine and green tea", icon: "leaf" },
      { text: "Low in fat and carbohydrates", icon: "drop" },
    ],
    ingredients: "Whey Protein Isolate, Garcinia Cambogia (Hydroxy Citric Acid), Green Tea Extract, Green Coffee Extract, Coffee Seed, Multi Enzyme Complex (Amylase, Lipase, Protease), Dietary Fibre (Fructo-Oligosaccharide), Lecithin (INS 322), Emulsifier (INS 466), Permitted Natural And Artificial Sweetener (INS 955), Preservative, Colouring & Flavouring Substances.",
    directionsOfUse: "Mix 1 scoop (30g) into 200ml of water and consume immediately after training, or between meals as a high-protein snack.",
    whoIsThisFor: "Anyone in a calorie deficit who wants to hold onto muscle while leaning out.",
    goal: ["weight_loss", "muscle_gain"],
    dietaryTags: ["vegetarian", "gluten_free"],
    tags: ["lean whey", "fat loss", "protein", "cutting"],
  },
  {
    slug: "xxl-weight-gainer",
    name: "MDN XXL Weight Gainer",
    categorySlug: "mass-gainer",
    productType: "Mass Gainer",
    sections: ["best_seller", "fitness_combo"],
    shortDescription: "190g carbs and 24g protein per serving with digestive enzymes, vitamins and minerals.",
    description:
      "A serious calorie surplus in a shaker. 190g of carbohydrates and 24g of protein per serving, with micellar casein, plant protein, digestive enzymes, added L-taurine and a full vitamin and mineral profile. Built for hard gainers who struggle to eat enough to grow.",
    images: ["gainer-3kg-front.jpg", "gainer-4550-front.jpg"],
    sizes: mk("MDN-XXL", [
      ["1kg", 1799, 1399, 110, 8, "2-week supply"],
      ["3kg", 3999, 3099, 140, 36, "1-month supply"],
      ["4.55kg", 5499, 4299, 80, 45, "1.5-month supply"],
      ["6kg", 7499, 5799, 35, 60, "2-month supply"],
    ]),
    flavors: FOUR,
    nutrition: { servingSize: "250g (2 scoops)", servingsPerContainer: 36, calories: 880, protein: 24, carbs: 190, fats: 4, sugar: 12,
      otherNutrients: [{ name: "L-Taurine", amount: "2.5g" }, { name: "Digestive Enzyme Complex", amount: "150mg" }] },
    nutritionHighlights: [{ label: "Kcal", value: "880" }, { label: "Protein", value: "24Gms" }, { label: "Carbs", value: "190G" }, { label: "L-Taurine", value: "2.5G" }, { label: "Servings", value: "36+" }],
    benefits: [
      { text: "High-calorie mass formula", icon: "bolt" },
      { text: "Supports serious size gains", icon: "muscle" },
      { text: "Added digestive enzymes", icon: "leaf" },
      { text: "Vitamins and minerals included", icon: "shield" },
    ],
    ingredients: "Maltodextrin, Whey Protein Concentrate, Micellar Casein Protein, Plant Protein, Cocoa Powder (processed with alkali), Digestive Enzymes (Amylase, Lipase, Protease), Tri-Calcium Phosphate, Emulsifier (INS 466), Vitamins & Minerals Premix, Permitted Artificial Sweetener (INS 955), Colouring & Flavouring Substances.",
    directionsOfUse: "Mix 2 scoops (250g) into 300–400ml of milk, coconut water or plain water. Shake well and consume immediately. One serving daily, ideally post-workout or between meals.",
    whoIsThisFor: "Hard gainers and anyone bulking who can't hit their calorie target through food alone.",
    goal: ["muscle_gain"],
    dietaryTags: ["vegetarian"],
    tags: ["mass gainer", "weight gainer", "bulking", "calories"],
  },
  {
    slug: "creatine-monohydrate",
    name: "MDN Creatine Monohydrate",
    categorySlug: "creatine",
    productType: "Creatine",
    sections: ["best_seller", "new_arrival"],
    shortDescription: "3g of micronised creatine monohydrate per scoop. One ingredient, nothing else.",
    description:
      "Pure micronised creatine monohydrate — the most researched sports supplement there is, and the entire ingredient list. 3g per scoop supports high-intensity output, strength and lean mass over time. Micronised so it disperses quickly instead of settling at the bottom of the glass.",
    images: ["creatine-front.jpg", "creatine-back.jpg"],
    sizes: mk("MDN-CRE", [
      ["100g", 799, 599, 210, 33, "1-month supply"],
      ["250g", 1599, 1199, 160, 83, "2.5-month supply"],
      ["500g", 2799, 2099, 120, 166, "5-month supply"],
      ["1kg", 4999, 3699, 60, 333, "10-month supply"],
    ]),
    flavors: FOUR,
    nutrition: { servingSize: "3g (1 scoop approx)", servingsPerContainer: 33, calories: 12, protein: 0, carbs: 0, fats: 0, sugar: 0,
      otherNutrients: [{ name: "Creatine Monohydrate", amount: "3g" }] },
    nutritionHighlights: [{ label: "Kcal", value: "12" }, { label: "Creatine", value: "3G" }, { label: "Carbs", value: "0G" }, { label: "Fat", value: "0G" }, { label: "Purity", value: "100%" }],
    benefits: [
      { text: "Supports strength and power output", icon: "bolt" },
      { text: "Micronised for easy mixing", icon: "drop" },
      { text: "One ingredient, no fillers", icon: "check" },
      { text: "Most researched sports supplement", icon: "flask" },
    ],
    ingredients: "100% Micronised Creatine Monohydrate. No fillers, no flavouring, no additives.",
    directionsOfUse: "Mix 1 scoop (3g) into 200ml of water or juice, any time of day. Consistency matters more than timing — take it daily, including rest days.",
    whoIsThisFor: "Anyone doing resistance or high-intensity training who wants more output across a set.",
    goal: ["muscle_gain", "endurance"],
    dietaryTags: ["vegan", "vegetarian", "gluten_free", "keto"],
    tags: ["creatine", "creatine monohydrate", "strength", "power"],
  },
  {
    slug: "pre-workout",
    name: "MDN Pre Workout",
    categorySlug: "pre-workout",
    productType: "Pre-Workout",
    sections: ["best_seller"],
    shortDescription: "100mg caffeine, 2g beta-alanine and 2g citrulline malate per 6g scoop.",
    description:
      "A balanced pre-workout that hits pump, strength and focus without wrecking your sleep. 100mg of caffeine per scoop (150mg on a 1.5 scoop serving), beta-alanine and citrulline malate for the pump, plus creatine, betaine, L-tyrosine and taurine. Start at half a scoop to check tolerance.",
    images: ["preworkout-front.jpg", "preworkout-back.jpg"],
    sizes: mk("MDN-PRE", [
      ["180g", 1299, 999, 130, 30, "1-month supply"],
      ["300g", 1999, 1549, 110, 50, "1.5-month supply"],
      ["450g", 2799, 2149, 70, 75, "2.5-month supply"],
      ["600g", 3499, 2699, 40, 100, "3-month supply"],
    ]),
    flavors: FIVE,
    nutrition: { servingSize: "6g (1 scoop)", servingsPerContainer: 30, calories: 3, protein: 0, carbs: 0, fats: 0, sugar: 0,
      otherNutrients: [{ name: "Caffeine", amount: "100mg" }, { name: "Beta-Alanine", amount: "2000mg" }, { name: "L-Citrulline DL-Malate", amount: "2000mg" }, { name: "Creatine", amount: "500mg" }, { name: "Betaine", amount: "300mg" }, { name: "L-Tyrosine", amount: "300mg" }] },
    nutritionHighlights: [{ label: "Kcal", value: "3" }, { label: "Caffeine", value: "100mg" }, { label: "Beta-Alanine", value: "2G" }, { label: "Citrulline", value: "2G" }, { label: "Servings", value: "30" }],
    benefits: [
      { text: "Sharper focus and drive", icon: "bolt" },
      { text: "Better pumps and endurance", icon: "muscle" },
      { text: "Zero sugar, 3 kcal per scoop", icon: "drop" },
      { text: "Start at half a scoop", icon: "shield" },
    ],
    ingredients: "L-Citrulline DL-Malate (2:1), Beta-Alanine, Creatine Monohydrate, Betaine (N,N,N-Trimethylglycine), L-Tyrosine, L-Taurine, Caffeine Anhydrous, Black Pepper Extract (Piperine), Permitted Artificial Sweetener (Sucralose), Flavour & Colour.",
    directionsOfUse: "Mix 1 scoop (6g) into 250ml of cold water 20–30 minutes before training. Start with half a serving to assess tolerance. Do not take within 4 hours of bedtime.",
    whoIsThisFor: "Anyone who wants more intensity in the gym and trains earlier in the day.",
    goal: ["endurance", "muscle_gain"],
    dietaryTags: ["vegetarian", "gluten_free"],
    tags: ["pre workout", "caffeine", "pump", "energy"],
  },
  {
    slug: "pre-workout-plus",
    name: "MDN Pre Workout+",
    categorySlug: "pre-workout",
    productType: "Pre-Workout",
    sections: ["new_arrival"],
    shortDescription: "Higher-stim 8g scoop: 190mg caffeine and 2.75g citrulline for advanced lifters.",
    description:
      "The stronger version of our pre-workout, built for people who have already run a standard scoop and want more. 190mg of caffeine, 2.75g of citrulline DL-malate, 2.3g beta-alanine, creatine nitrate and choline bitartrate per 8g serving. Not a starting point — build tolerance first.",
    images: ["preworkout-plus-back.jpg", "preworkout-front.jpg"],
    sizes: mk("MDN-PRP", [
      ["160g", 1499, 1149, 100, 20, "3-week supply"],
      ["320g", 2599, 1999, 90, 40, "1.5-month supply"],
      ["480g", 3599, 2799, 55, 60, "2-month supply"],
      ["640g", 4499, 3499, 30, 80, "3-month supply"],
    ]),
    flavors: FIVE,
    nutrition: { servingSize: "8g (1 scoop)", servingsPerContainer: 40, calories: 8, protein: 0, carbs: 0, fats: 0, sugar: 2,
      otherNutrients: [{ name: "Caffeine", amount: "190mg" }, { name: "L-Citrulline DL-Malate", amount: "2750mg" }, { name: "Beta-Alanine", amount: "2300mg" }, { name: "Creatine Nitrate", amount: "200mg" }, { name: "Choline Bitartrate", amount: "4mg" }] },
    nutritionHighlights: [{ label: "Kcal", value: "8" }, { label: "Caffeine", value: "190mg" }, { label: "Citrulline", value: "2.75G" }, { label: "Beta-Alanine", value: "2.3G" }, { label: "Servings", value: "40" }],
    benefits: [
      { text: "High-stim formula for advanced users", icon: "bolt" },
      { text: "Maximum pump and vascularity", icon: "muscle" },
      { text: "Added creatine nitrate", icon: "flask" },
      { text: "Assess tolerance before full scoop", icon: "shield" },
    ],
    ingredients: "L-Citrulline DL-Malate (2:1), Beta-Alanine, L-Taurine, Betaine (N,N,N-Trimethylglycine), Creatine Nitrate, L-Tyrosine, Caffeine Anhydrous, Choline Bitartrate, Vitamin B3 (Niacin), Vitamin B6, Black Pepper Extract (Piperine), Permitted Artificial Sweetener (Sucralose), Flavour.",
    directionsOfUse: "Mix 1 scoop (8g) into 300ml of cold water 20–30 minutes before training. Begin with half a scoop. Not recommended if you are sensitive to caffeine, and never within 6 hours of bedtime.",
    whoIsThisFor: "Experienced lifters already used to a standard pre-workout who want a stronger hit.",
    goal: ["endurance", "muscle_gain"],
    dietaryTags: ["vegetarian", "gluten_free"],
    tags: ["pre workout", "high stim", "caffeine", "pump"],
  },
  {
    slug: "liquid-pre-workout",
    name: "MDN Liquid Pre Workout",
    categorySlug: "pre-workout",
    productType: "Pre-Workout",
    sections: ["new_arrival", "fitness_combo"],
    shortDescription: "Ready-to-drink 520ml with 8000mg glycerol and 3800mg citrulline per serving.",
    description:
      "No shaker, no clumps — a ready-to-drink pre-workout you measure straight from the bottle. 8000mg of glycerol for cell volumisation, 3800mg citrulline DL-malate, 2000mg beta-alanine and 130mg caffeine per 20ml serving, plus L-theanine and mucuna pruriens for a cleaner focus without the crash.",
    images: ["liquid-pre-front.jpg", "liquid-pre-back.jpg"],
    sizes: mk("MDN-LQP", [
      ["260ml", 999, 799, 90, 13, "2-week supply"],
      ["520ml", 1799, 1399, 120, 26, "1-month supply"],
      ["1040ml", 3299, 2549, 60, 52, "2-month supply"],
      ["1560ml", 4699, 3599, 30, 78, "3-month supply"],
    ]),
    flavors: FOUR,
    nutrition: { servingSize: "20ml", servingsPerContainer: 26, calories: 40, protein: 0, carbs: 8, fats: 0, sugar: 0,
      otherNutrients: [{ name: "Glycerol", amount: "8000mg" }, { name: "L-Citrulline DL-Malate", amount: "3800mg" }, { name: "Beta-Alanine", amount: "2000mg" }, { name: "Caffeine", amount: "130mg" }, { name: "L-Theanine", amount: "570mg" }, { name: "Mucuna Pruriens", amount: "72mg" }] },
    nutritionHighlights: [{ label: "Kcal", value: "40" }, { label: "Glycerol", value: "8000mg" }, { label: "Citrulline", value: "3.8G" }, { label: "Caffeine", value: "130mg" }, { label: "Servings", value: "26" }],
    benefits: [
      { text: "Ready to drink, no mixing", icon: "drop" },
      { text: "8000mg glycerol for big pumps", icon: "muscle" },
      { text: "Clean focus with L-theanine", icon: "bolt" },
      { text: "No added sugar", icon: "check" },
    ],
    ingredients: "Purified Water, L-Citrulline DL-Malate (2:1), Glycerol, Beta-Alanine, L-Taurine, L-Theanine, Betaine, Caffeine, Niacin, L-Tyrosine, Piper Nigrum (Piperine), Mucuna Pruriens (40%), Acidity Regulator (INS 330, INS 296), Permitted Artificial Sweetener (INS 955), Flavour & Colour.",
    directionsOfUse: "Shake well before use. Take 20ml 20–30 minutes before training, neat or diluted in water. Start with half a serving to check tolerance. Contains caffeine.",
    whoIsThisFor: "Anyone who trains away from home and wants a pre-workout that needs no shaker or scoop.",
    goal: ["endurance", "muscle_gain"],
    dietaryTags: ["vegetarian", "gluten_free"],
    tags: ["liquid pre workout", "glycerol", "pump", "ready to drink"],
  },
  {
    slug: "l-glutamine",
    name: "MDN L-Glutamine",
    categorySlug: "amino-acids",
    productType: "Amino Acids",
    sections: ["new_arrival"],
    shortDescription: "5g of pure L-glutamine per serving. Gluten free and non-GMO.",
    description:
      "Unflavoured L-glutamine for recovery between hard sessions. 5g per half-scoop serving, nothing else in the tub. Glutamine is the most abundant amino acid in muscle tissue and the first thing depleted by heavy training — this replaces it without any additives.",
    images: ["glutamine-front.jpg", "glutamine-back.jpg"],
    sizes: mk("MDN-GLU", [
      ["100g", 699, 549, 140, 20, "3-week supply"],
      ["300g", 1499, 1149, 160, 60, "2-month supply"],
      ["500g", 2199, 1699, 90, 100, "3-month supply"],
      ["1kg", 3999, 2999, 45, 200, "6-month supply"],
    ]),
    flavors: FOUR,
    nutrition: { servingSize: "5g (1/2 scoop approx)", servingsPerContainer: 60, calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0,
      otherNutrients: [{ name: "L-Glutamine", amount: "5g" }] },
    nutritionHighlights: [{ label: "Kcal", value: "0" }, { label: "L-Glutamine", value: "5G" }, { label: "Carbs", value: "0G" }, { label: "Fat", value: "0G" }, { label: "Purity", value: "100%" }],
    benefits: [
      { text: "Repairs and rebuilds muscle", icon: "muscle" },
      { text: "Supports recovery from endurance work", icon: "heart" },
      { text: "Gluten free and non-GMO", icon: "leaf" },
      { text: "No fillers or additives", icon: "check" },
    ],
    ingredients: "100% L-Glutamine. No other ingredients.",
    directionsOfUse: "Mix 5g into 200ml of water and take post-workout or before bed. Can be added to your protein shake.",
    whoIsThisFor: "Anyone training hard several days a week who feels recovery lagging between sessions.",
    goal: ["recovery", "endurance"],
    dietaryTags: ["vegan", "vegetarian", "gluten_free", "keto"],
    tags: ["glutamine", "amino acids", "recovery", "repair"],
  },
  {
    slug: "muscle-power-hydration",
    name: "MDN Muscle Power & Hydration",
    categorySlug: "amino-acids",
    productType: "Amino Acids",
    sections: ["new_arrival", "fitness_combo"],
    shortDescription: "Amino acids, electrolytes, vitamins and botanicals in one 30g serving.",
    description:
      "An intra-workout replenishing drink covering amino acids, electrolytes and glycogen in one scoop. A 1550mg amino blend with BCAAs and creatine nitrate, a 380mg botanical extract blend, plus colostrum, glutathione and MCTs. Delivers 100% daily value of five nutrients with a bloat-free finish.",
    images: ["hydration-front.jpg", "hydration-back.jpg"],
    sizes: mk("MDN-MPH", [
      ["500g", 1699, 1299, 90, 16, "2-week supply"],
      ["1kg", 2999, 2299, 120, 33, "1-month supply"],
      ["2kg", 5499, 4199, 55, 66, "2-month supply"],
      ["3kg", 7999, 5999, 25, 100, "3-month supply"],
    ]),
    flavors: ALL6,
    nutrition: { servingSize: "30g (2 scoops)", servingsPerContainer: 33, calories: 84.5, protein: 9, carbs: 20, fats: 0, sugar: 20,
      otherNutrients: [{ name: "Amino Blend", amount: "1550mg" }, { name: "Botanical Extracts Blend", amount: "380mg" }, { name: "Other Nutrients Blend", amount: "500mg" }, { name: "Vitamin C", amount: "80mg" }, { name: "Potassium", amount: "240mg" }] },
    nutritionHighlights: [{ label: "Kcal", value: "84.5" }, { label: "Protein", value: "9Gms" }, { label: "Carbs", value: "20G" }, { label: "Aminos", value: "1550mg" }, { label: "Servings", value: "33" }],
    benefits: [
      { text: "Replenishes electrolytes and glycogen", icon: "drop" },
      { text: "Amino acids for muscle support", icon: "muscle" },
      { text: "100% daily value of 5 nutrients", icon: "shield" },
      { text: "Pure, bloat-free experience", icon: "leaf" },
    ],
    ingredients: "Sugar Beet, Dextrose Monohydrate, Oats Powder, Amino Blend (L-Methionine, L-Histidine, L-Threonine, L-Tryptophan, L-Phenylalanine, L-Lysine, L-Arginine, L-Carnitine, L-Citrulline, L-Tyrosine, L-Taurine, L-Theanine, Betaine, Beta Alanine, Creatine Nitrate, BCAAs 2:1:1, L-Glutamine), Botanical Extracts Blend, Colostrum, Coconut Water, Glutathione Reduced, Choline Bitartrate, MCT, Vitamins & Minerals, Acidity Regulator (INS 330, INS 296), Permitted Artificial Sweetener (INS 960), Flavour.",
    directionsOfUse: "Mix 2 scoops (30g) into 400–500ml of water and sip through your session, or immediately after. One serving daily.",
    whoIsThisFor: "Anyone doing long or hot sessions where hydration and electrolytes matter as much as protein.",
    goal: ["endurance", "recovery"],
    dietaryTags: ["vegetarian", "gluten_free"],
    tags: ["hydration", "electrolytes", "amino acids", "intra workout"],
  },
  {
    slug: "l-carnitine-liquid",
    name: "MDN L-Carnitine Liquid",
    categorySlug: "fat-burner",
    productType: "Fat Burner",
    sections: ["fitness_combo"],
    shortDescription: "3000mg of L-carnitine per 15ml serving with vitamin B5. Zero calories.",
    description:
      "Liquid L-carnitine at 3000mg per serving, with vitamin B5 at 100% RDA. Carnitine's job is shuttling fatty acids into the mitochondria to be burned for fuel — useful alongside a deficit and regular cardio. Zero calories, zero sugar, and it absorbs faster than a capsule.",
    images: ["carnitine-back.jpg", "supplements-front.jpg"],
    sizes: mk("MDN-CAR", [
      ["150ml", 899, 699, 100, 10, "10-day supply"],
      ["300ml", 1599, 1249, 130, 20, "3-week supply"],
      ["500ml", 2399, 1849, 80, 33, "1-month supply"],
      ["1000ml", 4299, 3299, 35, 66, "2-month supply"],
    ]),
    flavors: FOUR,
    nutrition: { servingSize: "15ml", servingsPerContainer: 33, calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0,
      otherNutrients: [{ name: "L-Carnitine", amount: "3000mg" }, { name: "Vitamin B5 (Pantothenic Acid)", amount: "5mg" }] },
    nutritionHighlights: [{ label: "Kcal", value: "0" }, { label: "L-Carnitine", value: "3000mg" }, { label: "Vitamin B5", value: "5mg" }, { label: "Sugar", value: "0G" }, { label: "Servings", value: "33" }],
    benefits: [
      { text: "Supports fat metabolism", icon: "flask" },
      { text: "Zero calories, zero sugar", icon: "drop" },
      { text: "Absorbs faster than capsules", icon: "bolt" },
      { text: "Added vitamin B5", icon: "check" },
    ],
    ingredients: "Purified Water, L-Carnitine Tartrate, Vitamin B5 (Pantothenic Acid), Acidity Regulator, Permitted Artificial Sweetener, Flavour.",
    directionsOfUse: "Take 15ml 30 minutes before cardio or your workout, on an empty stomach where possible. Once daily.",
    whoIsThisFor: "Anyone in a calorie deficit doing regular cardio who wants support on the fat-metabolism side.",
    goal: ["weight_loss", "endurance"],
    dietaryTags: ["gluten_free"],
    tags: ["l-carnitine", "fat burner", "fat loss", "cardio"],
  },
  {
    slug: "hydroxy-fat-cutter-pro",
    name: "MDN Hydroxy Fat Cutter Pro",
    categorySlug: "fat-burner",
    productType: "Fat Burner",
    sections: ["best_seller", "fitness_combo"],
    shortDescription: "Garcinia, green coffee, green tea and L-carnitine in a 120-capsule bottle.",
    description:
      "A thermogenic capsule stacking garcinia cambogia, green coffee bean, green tea and grape seed extract with L-carnitine and yohimbine. Supports appetite control and fat metabolism alongside a calorie deficit. 120 capsules — a two-month course at one a day.",
    images: ["fatcutter-front.jpg", "fatcutter-back.jpg"],
    sizes: mk("MDN-HFC", [
      ["60 capsules", 1099, 849, 120, 60, "2-month supply"],
      ["120 capsules", 1899, 1449, 150, 120, "4-month supply"],
      ["180 capsules", 2699, 2049, 70, 180, "6-month supply"],
      ["240 capsules", 3399, 2599, 40, 240, "8-month supply"],
    ]),
    flavors: FOUR,
    nutrition: { servingSize: "1 capsule", servingsPerContainer: 120, calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0,
      otherNutrients: [{ name: "Garcinia Cambogia (60%)", amount: "120mg" }, { name: "Green Coffee Bean (50%)", amount: "90mg" }, { name: "Green Tea Extract (95%)", amount: "90mg" }, { name: "Grape Seed Extract", amount: "35mg" }, { name: "Ginger Extract", amount: "35mg" }, { name: "Yohimbine (97%)", amount: "5mg" }, { name: "Vitamin B6", amount: "800mcg" }] },
    nutritionHighlights: [{ label: "Kcal", value: "0" }, { label: "Garcinia", value: "120mg" }, { label: "Green Tea", value: "90mg" }, { label: "Vitamin B6", value: "800mcg" }, { label: "Capsules", value: "120" }],
    benefits: [
      { text: "Supports fat metabolism", icon: "flask" },
      { text: "Helps manage appetite", icon: "check" },
      { text: "Green tea and green coffee extracts", icon: "leaf" },
      { text: "One capsule a day", icon: "shield" },
    ],
    ingredients: "Garcinia Cambogia Extract (60%), Vitamin B6 (Pyridoxine HCL), Green Coffee Bean Extract (50%), Green Tea Extract (95%), Grape Seed Extract (10:1), Ginger Extract (2%), Pineapple Extract (10:1), Coleus Forskohlii Extract (10%), Black Pepper Extract (95%), Yohimbine Extract (97%), Veg Cellulose Capsule.",
    directionsOfUse: "Take 1 capsule daily with water, 30 minutes before a meal. Do not exceed one capsule in 24 hours. Contains yohimbine — not suitable if you are sensitive to stimulants.",
    whoIsThisFor: "Anyone already in a calorie deficit who wants extra support on appetite and fat metabolism.",
    goal: ["weight_loss"],
    dietaryTags: ["vegetarian", "gluten_free"],
    tags: ["fat burner", "fat cutter", "garcinia", "weight loss"],
  },
  {
    slug: "testo-pro",
    name: "MDN Testo Pro",
    categorySlug: "wellness",
    productType: "Testosterone Support",
    sections: ["best_seller"],
    shortDescription: "1000mg D-aspartic acid with ashwagandha, shilajit and safed musli.",
    description:
      "A natural testosterone support formula built on 1000mg of D-aspartic acid per serving, backed by ashwagandha, shilajit sudha, kaonch beej, tal makhana and safed musli at 200mg each. Aimed at energy, pump and endurance in men who train.",
    images: ["testo-front.jpg", "testo-back.jpg"],
    sizes: mk("MDN-TST", [
      ["50 tablets", 1199, 899, 110, 25, "3-week supply"],
      ["100 tablets", 1999, 1549, 140, 50, "1.5-month supply"],
      ["150 tablets", 2799, 2149, 65, 75, "2.5-month supply"],
      ["200 tablets", 3499, 2699, 35, 100, "3-month supply"],
    ]),
    flavors: FOUR,
    nutrition: { servingSize: "2 tablets", servingsPerContainer: 50, calories: 2.56, protein: 0, carbs: 0.44, fats: 0, sugar: 0,
      otherNutrients: [{ name: "D-Aspartic Acid", amount: "1000mg" }, { name: "Ashwagandha", amount: "200mg" }, { name: "Shilajit Sudha", amount: "200mg" }, { name: "Kaonch Beej", amount: "200mg" }, { name: "Tal Makhana", amount: "200mg" }, { name: "Safed Musli", amount: "200mg" }] },
    nutritionHighlights: [{ label: "Kcal", value: "2.56" }, { label: "D-Aspartic", value: "1000mg" }, { label: "Ashwagandha", value: "200mg" }, { label: "Shilajit", value: "200mg" }, { label: "Servings", value: "50" }],
    benefits: [
      { text: "Supports natural testosterone", icon: "bolt" },
      { text: "Ayurvedic herb blend", icon: "leaf" },
      { text: "Energy, pump and endurance", icon: "muscle" },
      { text: "1000mg D-aspartic acid", icon: "flask" },
    ],
    ingredients: "D-Aspartic Acid, Ashwagandha, Shilajit Sudha, Kaonch Beej, Kuchla (Sudha), Tal Makhana, Safed Musli, Excipients q.s.",
    directionsOfUse: "Take 2 tablets daily with water after a meal, or as directed by your healthcare professional.",
    whoIsThisFor: "Adult men training regularly who want support for energy, drive and recovery.",
    goal: ["muscle_gain", "general_health"],
    dietaryTags: ["vegetarian"],
    tags: ["testosterone", "testo", "d-aspartic acid", "ashwagandha"],
  },
  {
    slug: "multivitamin",
    name: "MDN Multivitamin",
    categorySlug: "wellness",
    productType: "Multivitamin",
    sections: ["best_seller", "fitness_combo"],
    shortDescription: "Complete daily vitamins, minerals and botanicals in one tablet.",
    description:
      "A full daily cover in a single tablet — vitamins A through B12, zinc, iodine, calcium, selenium, chromium, copper, manganese and magnesium, plus ginkgo biloba, ashwagandha, grape seed, green tea and lycopene. Built for active individuals whose diets have gaps.",
    images: ["multivitamin-front.jpg", "multivitamin-back.jpg"],
    sizes: mk("MDN-MTV", [
      ["60 tablets", 799, 599, 130, 60, "2-month supply"],
      ["120 tablets", 1399, 1049, 170, 120, "4-month supply"],
      ["180 tablets", 1999, 1499, 80, 180, "6-month supply"],
      ["240 tablets", 2499, 1899, 45, 240, "8-month supply"],
    ]),
    flavors: FOUR,
    nutrition: { servingSize: "1 tablet", servingsPerContainer: 120, calories: 1, protein: 0.07, carbs: 0.12, fats: 0.02, sugar: 0,
      otherNutrients: [{ name: "Vitamin C", amount: "50mg" }, { name: "Vitamin D", amount: "400 IU" }, { name: "Zinc", amount: "17mg" }, { name: "Calcium", amount: "250mg" }, { name: "Ginkgo Biloba", amount: "10mg" }, { name: "Ashwagandha", amount: "25mg" }, { name: "Green Tea", amount: "50mg" }] },
    nutritionHighlights: [{ label: "Kcal", value: "1" }, { label: "Vitamin C", value: "50mg" }, { label: "Zinc", value: "17mg" }, { label: "Calcium", value: "250mg" }, { label: "Tablets", value: "120" }],
    benefits: [
      { text: "Complete daily vitamin cover", icon: "shield" },
      { text: "Minerals and botanical extracts", icon: "leaf" },
      { text: "Supports immunity and energy", icon: "heart" },
      { text: "Just one tablet a day", icon: "check" },
    ],
    ingredients: "Vitamins (A, C, D, E, B1, B2, B3, B6, B12, Folic Acid, Biotin, Beta-Carotene, Lutein), Minerals (Zinc, Iodine, Calcium, Selenium, Chromium, Copper, Manganese, Magnesium), Botanical Extracts (Ginkgo Biloba, Ashwagandha, Grape Seed, Green Tea, Lycopene), Excipients q.s.",
    directionsOfUse: "Take 1 tablet daily with a meal.",
    whoIsThisFor: "Active adults who want baseline nutritional cover alongside their training supplements.",
    goal: ["general_health"],
    dietaryTags: ["vegetarian", "gluten_free"],
    tags: ["multivitamin", "vitamins", "minerals", "immunity", "wellness"],
  },
  {
    slug: "golden-omega-3",
    name: "MDN Golden Omega 3",
    categorySlug: "wellness",
    productType: "Omega 3",
    sections: ["best_seller", "fitness_combo"],
    shortDescription: "1000mg deep sea fish oil with 330mg EPA and 220mg DHA per softgel.",
    description:
      "Deep sea fish oil at 1000mg per softgel, delivering 330mg EPA and 220mg DHA. Omega 3 supports heart, joint and brain health — the things that quietly matter when training volume is high. 90 softgels, one a day.",
    images: ["omega3-front.jpg", "supplements-front.jpg"],
    sizes: mk("MDN-OM3", [
      ["30 softgels", 599, 449, 120, 30, "1-month supply"],
      ["90 softgels", 1299, 999, 160, 90, "3-month supply"],
      ["180 softgels", 2299, 1749, 75, 180, "6-month supply"],
      ["300 softgels", 3499, 2649, 40, 300, "10-month supply"],
    ]),
    flavors: FOUR,
    nutrition: { servingSize: "1 softgel capsule", servingsPerContainer: 90, calories: 9, protein: 0, carbs: 0, fats: 1, sugar: 0,
      otherNutrients: [{ name: "Omega 3 Fatty Acids", amount: "1000mg" }, { name: "EPA", amount: "330mg" }, { name: "DHA", amount: "220mg" }] },
    nutritionHighlights: [{ label: "Kcal", value: "9" }, { label: "Omega 3", value: "1000mg" }, { label: "EPA", value: "330mg" }, { label: "DHA", value: "220mg" }, { label: "Softgels", value: "90" }],
    benefits: [
      { text: "Supports heart and joint health", icon: "heart" },
      { text: "330mg EPA per softgel", icon: "drop" },
      { text: "Deep sea fish oil source", icon: "flask" },
      { text: "One softgel a day", icon: "check" },
    ],
    ingredients: "Deep Sea Fish Oil (providing Omega 3 Fatty Acids, EPA and DHA), Gelatin, Glycerol, Purified Water.",
    directionsOfUse: "Take 1 softgel daily with a meal.",
    whoIsThisFor: "Anyone training hard who wants joint and cardiovascular support, or who eats little oily fish.",
    goal: ["general_health", "recovery"],
    dietaryTags: [],
    tags: ["omega 3", "fish oil", "epa", "dha", "wellness"],
    warnings: "Contains fish. Avoid if you have a seafood allergy. " + WARN,
  },
  {
    slug: "shilajit-resin",
    name: "MDN Shilajit Resin",
    categorySlug: "wellness",
    productType: "Shilajit",
    sections: ["new_arrival"],
    shortDescription: "Pure Himalayan shilajit resin, 20g jar. For stamina and energy.",
    description:
      "Traditional Himalayan shilajit resin, supplied in a 20g glass jar with a measuring spoon. Used in ayurveda for stamina, energy and general vitality. A pea-sized portion dissolved in warm milk or water each morning is all it takes.",
    images: ["shilajit-front.jpg", "shilajit-back.jpg"],
    sizes: mk("MDN-SHL", [
      ["10g", 799, 599, 110, 10, "10-day supply"],
      ["20g", 1399, 1049, 150, 20, "3-week supply"],
      ["30g", 1999, 1499, 70, 30, "1-month supply"],
      ["50g", 3099, 2349, 35, 50, "1.5-month supply"],
    ]),
    flavors: FOUR,
    nutrition: { servingSize: "0.5g – 1g (1 spoon)", servingsPerContainer: 20, calories: 2, protein: 0, carbs: 0, fats: 0, sugar: 0,
      otherNutrients: [{ name: "Shilajit Resin", amount: "1g" }, { name: "Fulvic Acid", amount: "Naturally occurring" }] },
    nutritionHighlights: [{ label: "Kcal", value: "2" }, { label: "Shilajit", value: "1G" }, { label: "Net Wt", value: "20G" }, { label: "Servings", value: "20" }, { label: "Purity", value: "100%" }],
    benefits: [
      { text: "Supports stamina and energy", icon: "bolt" },
      { text: "Traditional Himalayan resin", icon: "leaf" },
      { text: "Naturally occurring fulvic acid", icon: "flask" },
      { text: "Measuring spoon included", icon: "check" },
    ],
    ingredients: "100% Purified Himalayan Shilajit Resin (Asphaltum Punjabinum).",
    directionsOfUse: "Take 0.5g to 1g (roughly one full spoon) dissolved in warm milk or water, once daily — ideally in the morning. Store in a cool, dark, dry place. Do not refrigerate.",
    whoIsThisFor: "Anyone looking for a traditional ayurvedic option for daily stamina and energy.",
    goal: ["endurance", "general_health"],
    dietaryTags: ["vegetarian"],
    tags: ["shilajit", "ayurveda", "stamina", "energy", "wellness"],
  },
  {
    slug: "liver-support",
    name: "MDN Liver Support",
    categorySlug: "wellness",
    productType: "Liver Support",
    sections: ["new_arrival"],
    shortDescription: "Silymarin, kutki, mushroom and L-ornithine L-aspartate in a veg capsule.",
    description:
      "A liver support capsule combining silymarin (milk thistle) at 160mg with kutki (picrorhiza), mushroom extract and L-ornithine L-aspartate, each at 160mg. Worth having in the stack if you are running a high-protein diet or a long supplement course.",
    images: ["liver-back.jpg", "supplements-front.jpg"],
    sizes: mk("MDN-LVR", [
      ["30 capsules", 699, 549, 100, 30, "1-month supply"],
      ["60 capsules", 1199, 899, 130, 60, "2-month supply"],
      ["90 capsules", 1699, 1299, 65, 90, "3-month supply"],
      ["120 capsules", 2099, 1599, 35, 120, "4-month supply"],
    ]),
    flavors: FOUR,
    nutrition: { servingSize: "1 veg capsule", servingsPerContainer: 60, calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0,
      otherNutrients: [{ name: "Silymarin 80% (Milk Thistle)", amount: "160mg" }, { name: "Kutki (Picrorhiza)", amount: "160mg" }, { name: "Mushroom Extract", amount: "160mg" }, { name: "L-Ornithine L-Aspartate", amount: "160mg" }] },
    nutritionHighlights: [{ label: "Kcal", value: "0" }, { label: "Silymarin", value: "160mg" }, { label: "Kutki", value: "160mg" }, { label: "Mushroom", value: "160mg" }, { label: "Capsules", value: "60" }],
    benefits: [
      { text: "Supports healthy liver function", icon: "shield" },
      { text: "Silymarin from milk thistle", icon: "leaf" },
      { text: "Veg capsule, zero calories", icon: "check" },
      { text: "Pairs well with high-protein diets", icon: "flask" },
    ],
    ingredients: "Silymarin 80% (Milk Thistle Extract), Kutki (Picrorhiza) Extract, Mushroom Extract, L-Ornithine L-Aspartate, Hydroxy Propyl Methyl Cellulose Veg Capsule.",
    directionsOfUse: "Take 1 capsule daily with water after a meal, or as directed by your healthcare professional.",
    whoIsThisFor: "Anyone on a long supplement course or a sustained high-protein diet who wants liver support.",
    goal: ["general_health"],
    dietaryTags: ["vegetarian", "gluten_free"],
    tags: ["liver", "silymarin", "milk thistle", "detox", "wellness"],
  },
];

async function main() {
  await connectDB();

  const catId = {};
  let catsMade = 0;
  for (const c of CATEGORIES) {
    const found = await Category.findOne({ slug: c.slug });
    if (found) { catId[c.slug] = found._id; continue; }
    if (DRY) { catId[c.slug] = null; catsMade++; continue; }
    catId[c.slug] = (await Category.create(c))._id;
    catsMade++;
  }
  console.log(`Categories: ${catsMade} created, ${CATEGORIES.length - catsMade} already present`);

  const existing = await Product.countDocuments();
  console.log(`Existing products to remove: ${existing}`);

  if (DRY) {
    console.log(`\n--dry: would delete ${existing} product(s) and insert ${P.length}.`);
    for (const p of P) {
      console.log(`  ${p.name}  [${p.sizes.length} sizes, ${p.flavors.length} flavours, sections: ${p.sections.join("+")}]`);
    }
    await mongoose.disconnect();
    return;
  }

  // Clear the old catalogue and any cart lines pointing at it, so no cart
  // is left holding a reference to a product that no longer exists.
  const ids = (await Product.find({}).select("_id")).map((d) => d._id);
  await Product.deleteMany({});
  if (ids.length) await Cart.updateMany({}, { $pull: { items: { product: { $in: ids } } } });
  console.log(`Deleted ${ids.length} product(s) and cleaned them out of all carts.`);

  for (const p of P) {
    const { categorySlug, images, warnings, ...rest } = p;
    await Product.create({
      ...rest,
      brand: "MDN",
      category: catId[categorySlug],
      thumbnail: IMG(images[0]),
      images: images.map(IMG),
      posterTop: POSTER_TOP,
      posterBottom: POSTER_BOTTOM,
      warnings: warnings || WARN,
      isActive: true,
      manufactureDate: MFG,
      expiryDate: EXP,
      ratingsAverage: 0,
      ratingsCount: 0,
      seo: { metaTitle: `${p.name} — Buy Online | MDN My Daily Nutrition`, metaDescription: p.shortDescription },
    });
  }
  console.log(`Inserted ${P.length} products.`);

  for (const s of ["best_seller", "new_arrival", "fitness_combo"]) {
    console.log(`  ${s}: ${await Product.countDocuments({ isActive: true, sections: s })}`);
  }
  console.log(`Total active: ${await Product.countDocuments({ isActive: true })}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
