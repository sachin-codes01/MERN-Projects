// Idempotent demo-catalogue seed: creates the storefront categories and a
// full set of demo products spread across all three homepage sections
// (best_seller / new_arrival / fitness_combo), each with complete detail —
// sizes, flavors, nutrition, directions, warnings, SEO and a real photo
// gallery.
//
// Photos live in client/public/product-images (square, web-sized copies of
// the shoot in "MDN product List"), so they're served as ordinary static
// files by the client host — no Cloudinary upload needed for demo data.
// Swap `thumbnail`/`images` for Cloudinary URLs when these become real
// listings.
//
// Safe to re-run: a product whose slug already exists is left completely
// untouched, so anything edited in the admin panel is never clobbered.
// Pass --force to overwrite the demo rows anyway.
//
// Usage: npm run seed:products   (from server/)
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../database");
const Category = require("../models/Category");
const Product = require("../models/Product");

const FORCE = process.argv.includes("--force");
const IMG = (file) => `/product-images/${file}`;
const POSTER_TOP = IMG("poster-wide.jpg");
const POSTER_BOTTOM = IMG("poster-brand.jpg");

const MFG = new Date("2026-03-01");
const EXP = new Date("2028-03-01");

const CATEGORIES = [
  { name: "Whey Protein", slug: "whey-protein", displayOrder: 1, description: "Concentrates, isolates and blends." },
  { name: "Mass Gainer", slug: "mass-gainer", displayOrder: 2, description: "Calorie-dense formulas for size." },
  { name: "Creatine", slug: "creatine", displayOrder: 3, description: "Strength and power support." },
  { name: "Pre-Workout", slug: "pre-workout", displayOrder: 4, description: "Energy, focus and pumps." },
  { name: "Amino Acids", slug: "amino-acids", displayOrder: 5, description: "Glutamine, BCAA and recovery aminos." },
  { name: "Fat Burner", slug: "fat-burner", displayOrder: 6, description: "Metabolism and cutting support." },
  { name: "Wellness", slug: "wellness", displayOrder: 7, description: "Daily health essentials." },
  { name: "Combos", slug: "combos", displayOrder: 8, description: "Bundled stacks at a saving." },
];

// Every product carries the same warning block — it's the standard
// nutraceutical disclaimer printed on the packs themselves.
const STANDARD_WARNING =
  "Not for medicinal use. Not recommended for persons under 18, or for pregnant or breastfeeding women. Consult a physician before use if you have a pre-existing medical condition or are on medication. Do not exceed the recommended daily dosage. Store in a cool, dry place away from direct sunlight. Keep out of reach of children.";

const PRODUCTS = [
  {
    name: "MDN Whey Protein",
    slug: "whey-protein",
    categorySlug: "whey-protein",
    productType: "Whey Protein",
    shortDescription: "24g protein and 5g BCAA per scoop, with digestive enzymes for easier absorption.",
    description:
      "MDN Whey Protein is a 100% whey concentrate blend built for everyday training support. Every scoop delivers 24g of protein and a naturally occurring 5g BCAA profile, with zero added sugar and an added digestive enzyme complex so it sits light rather than heavy. Each batch is lab-tested for protein content and banned substances before it ships, and the certificate of analysis is available on request. Mixes clean in water or milk with no chalky aftertaste.",
    goal: ["muscle_gain", "recovery"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["best_seller"],
    isFeatured: true,
    sizes: [
      { weight: "1kg", price: 4499, discountPrice: 2999, stock: 148, sku: "MDN-WHEY-1KG", servings: 28, supplyLabel: "1-month supply" },
      { weight: "2kg", price: 7999, discountPrice: 5499, stock: 92, sku: "MDN-WHEY-2KG", servings: 60, supplyLabel: "2-month supply" },
    ],
    flavors: [
      { name: "Chocolate", priceAdjustment: 0 },
      { name: "Malai Kulfi", priceAdjustment: 100 },
      { name: "Rabdi Kulfi", priceAdjustment: 100 },
    ],
    nutrition: {
      servingSize: "33g (1 scoop)",
      servingsPerContainer: 28,
      calories: 130,
      protein: 24,
      carbs: 3.2,
      fats: 1.8,
      sugar: 0,
      otherNutrients: [
        { name: "BCAA (naturally occurring)", amount: "5g" },
        { name: "Glutamic Acid", amount: "4.1g" },
        { name: "Digestive Enzyme Complex", amount: "50mg" },
      ],
    },
    ingredients:
      "Whey Protein Concentrate, Cocoa Powder, Natural & Nature-Identical Flavouring Substances, Digestive Enzyme Complex (Protease, Amylase, Lactase), Sweetener (INS 955), Salt.",
    directionsOfUse:
      "Add 1 scoop (33g) to 200-250ml of cold water or milk. Shake for 15-20 seconds. Take one serving post-workout, and a second serving between meals on training days if your daily protein target isn't met through food.",
    whoIsThisFor:
      "Anyone training 3+ days a week who struggles to hit their daily protein target through food alone. Suitable for beginners through advanced lifters.",
    images: ["whey-protein.jpg", "whey-protein-2.jpg", "whey-protein-3.jpg"],
    tags: ["whey protein", "protein powder", "whey", "supplements", "muscle gain"],
  },
  {
    name: "MDN Isolate Whey Protein",
    slug: "isolate-whey-protein",
    categorySlug: "whey-protein",
    productType: "Whey Isolate",
    shortDescription: "26g protein per scoop from pure isolate — lower lactose, faster absorbing.",
    description:
      "Whey protein isolate filtered to strip out the majority of lactose, fat and carbs, leaving 26g of fast-absorbing protein per 30g scoop. Because isolate is gentler on digestion than concentrate, this is the pick if regular whey leaves you bloated. Zero added sugar, no amino spiking, and a full amino acid profile printed on the pack rather than hidden behind a proprietary blend.",
    goal: ["muscle_gain", "recovery", "weight_loss"],
    dietaryTags: ["vegetarian", "gluten_free", "lactose_free"],
    sections: ["best_seller", "new_arrival"],
    isFeatured: true,
    sizes: [
      { weight: "1kg", price: 5799, discountPrice: 3999, stock: 76, sku: "MDN-ISO-1KG", servings: 33, supplyLabel: "1-month supply" },
      { weight: "2kg", price: 9999, discountPrice: 6999, stock: 41, sku: "MDN-ISO-2KG", servings: 66, supplyLabel: "2-month supply" },
    ],
    flavors: [
      { name: "Rabdi Kulfi", priceAdjustment: 0 },
      { name: "Chocolate", priceAdjustment: 0 },
      { name: "Unflavoured", priceAdjustment: -150 },
    ],
    nutrition: {
      servingSize: "30g (1 scoop)",
      servingsPerContainer: 33,
      calories: 116,
      protein: 26,
      carbs: 1.1,
      fats: 0.4,
      sugar: 0,
      otherNutrients: [
        { name: "BCAA (naturally occurring)", amount: "5.6g" },
        { name: "L-Leucine", amount: "2.7g" },
        { name: "Added Digestive Enzymes", amount: "50mg" },
      ],
    },
    ingredients:
      "Whey Protein Isolate, Natural & Nature-Identical Flavouring Substances, Digestive Enzyme Complex, Sweetener (INS 955), Salt.",
    directionsOfUse:
      "Mix 1 scoop (30g) into 200ml of cold water. Best taken immediately post-workout when absorption speed matters most. Can also be used first thing in the morning.",
    whoIsThisFor:
      "Lifters cutting or maintaining, and anyone who finds standard whey concentrate hard to digest.",
    images: ["isolate-whey-protein.jpg", "isolate-whey-protein-2.jpg"],
    tags: ["whey protein", "isolate", "whey isolate", "protein powder", "supplements"],
  },
  {
    name: "MDN Iso Lean Whey",
    slug: "iso-lean-whey",
    categorySlug: "whey-protein",
    productType: "Whey Isolate",
    shortDescription: "Lean isolate blend with added amino acids — built for definition, not bulk.",
    description:
      "Iso Lean pairs whey isolate with an added amino matrix for people training toward definition rather than size. Low carb, low fat, and no added sugar, so it fits a controlled calorie intake without giving up protein quality. The full typical amino acid profile is printed on the pack.",
    goal: ["weight_loss", "recovery", "endurance"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["new_arrival"],
    sizes: [
      { weight: "2kg", price: 8499, discountPrice: 5999, stock: 58, sku: "MDN-ISOLEAN-2KG", servings: 66, supplyLabel: "2-month supply" },
    ],
    flavors: [
      { name: "Rabdi Kulfi", priceAdjustment: 0 },
      { name: "Mango", priceAdjustment: 0 },
    ],
    nutrition: {
      servingSize: "30g (1 scoop)",
      servingsPerContainer: 66,
      calories: 114,
      protein: 25,
      carbs: 1.4,
      fats: 0.5,
      sugar: 0,
      otherNutrients: [
        { name: "Added Amino Acids", amount: "2000mg" },
        { name: "Naturally Occurring Minerals", amount: "500mg" },
      ],
    },
    ingredients:
      "Whey Protein Isolate, Added Amino Acids (L-Arginine, L-Glutamine, L-Carnitine), Natural & Nature-Identical Flavouring Substances, Sweetener (INS 955).",
    directionsOfUse:
      "Mix 1 scoop (30g) into 200ml cold water. Take post-workout or as a high-protein, low-calorie snack between meals.",
    whoIsThisFor: "Anyone in a cut or recomposition phase who wants protein without the extra calories.",
    images: ["iso-lean-whey.jpg", "iso-lean-whey-2.jpg"],
    tags: ["whey protein", "isolate", "lean protein", "supplements", "fat loss"],
  },
  {
    name: "MDN XXL Weight Gainer",
    slug: "xxl-weight-gainer",
    categorySlug: "mass-gainer",
    productType: "Mass Gainer",
    shortDescription: "Calorie-dense gainer with 24g protein and 190g carbs per serving.",
    description:
      "XXL Weight Gainer is built for hard gainers who genuinely struggle to eat enough. Each 250g serving stacks 190g of carbohydrates with 24g of protein plus added vitamins, minerals and digestive enzymes, so the calories are actually absorbed rather than sitting heavy. Available as a tub or the 4.5kg bucket for longer runs.",
    goal: ["muscle_gain"],
    dietaryTags: ["vegetarian"],
    sections: ["best_seller"],
    sizes: [
      { weight: "1kg", price: 2299, discountPrice: 1499, stock: 120, sku: "MDN-GAIN-1KG", servings: 4, supplyLabel: "Trial pack" },
      { weight: "3kg", price: 4999, discountPrice: 3299, stock: 64, sku: "MDN-GAIN-3KG", servings: 12, supplyLabel: "1-month supply" },
      { weight: "4.5kg", price: 6999, discountPrice: 4699, stock: 38, sku: "MDN-GAIN-45KG", servings: 18, supplyLabel: "6-week supply" },
    ],
    flavors: [
      { name: "Chocolate", priceAdjustment: 0 },
      { name: "Kesar Badam", priceAdjustment: 100 },
    ],
    nutrition: {
      servingSize: "250g (approx. 3 scoops)",
      servingsPerContainer: 18,
      calories: 952,
      protein: 24,
      carbs: 190,
      fats: 2.2,
      sugar: 10.1,
      otherNutrients: [
        { name: "Digestive Enzyme Complex", amount: "300mg" },
        { name: "Added Vitamins & Minerals", amount: "Multi-blend" },
        { name: "Dietary Fibre", amount: "2.5g" },
      ],
    },
    ingredients:
      "Maltodextrin, Whey Protein Concentrate, Cocoa Powder, Oat Flour, Vitamin & Mineral Premix, Digestive Enzyme Complex, Natural & Nature-Identical Flavouring Substances.",
    directionsOfUse:
      "Blend 3 scoops (250g) into 300-400ml of milk or water. Take one serving daily between meals, or split into two half servings if a full serving feels heavy. Best taken alongside — not instead of — regular meals.",
    whoIsThisFor:
      "Hard gainers and anyone in a deliberate bulking phase who can't hit their calorie target with food alone.",
    images: ["xxl-weight-gainer.jpg", "xxl-weight-gainer-2.jpg", "xxl-weight-gainer-3.jpg", "xxl-weight-gainer-4.jpg"],
    tags: ["mass gainer", "weight gainer", "gainer", "bulking", "supplements"],
  },
  {
    name: "MDN Creatine Monohydrate",
    slug: "creatine-monohydrate",
    categorySlug: "creatine",
    productType: "Creatine",
    shortDescription: "3g micronised creatine monohydrate per scoop. One ingredient, nothing else.",
    description:
      "Pure micronised creatine monohydrate — the single most researched sports supplement there is, and the whole ingredient list. 3g per scoop supports high-intensity output, strength and lean mass over time. Unflavoured and micronised so it disperses quickly instead of settling at the bottom of the glass.",
    goal: ["muscle_gain", "endurance"],
    dietaryTags: ["vegan", "vegetarian", "gluten_free", "keto"],
    sections: ["best_seller", "fitness_combo"],
    isFeatured: true,
    sizes: [
      { weight: "100g", price: 1099, discountPrice: 749, stock: 210, sku: "MDN-CREA-100G", servings: 33, supplyLabel: "1-month supply" },
      { weight: "250g", price: 2199, discountPrice: 1499, stock: 134, sku: "MDN-CREA-250G", servings: 83, supplyLabel: "2.5-month supply" },
    ],
    flavors: [],
    nutrition: {
      servingSize: "3g (1 scoop)",
      servingsPerContainer: 33,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      sugar: 0,
      otherNutrients: [{ name: "Creatine Monohydrate", amount: "3g" }],
    },
    ingredients: "100% Micronised Creatine Monohydrate. No fillers, no flavouring, no additives.",
    directionsOfUse:
      "Mix 1 scoop (3g) into 200ml of water or juice, any time of day. Consistency matters more than timing — take it daily, including rest days. No loading phase required.",
    whoIsThisFor:
      "Anyone doing resistance or high-intensity training who wants a proven, no-nonsense strength aid.",
    images: ["creatine-monohydrate.jpg", "creatine-monohydrate-2.jpg"],
    tags: ["creatine", "creatine monohydrate", "strength", "supplements"],
  },
  {
    name: "MDN L-Glutamine",
    slug: "l-glutamine",
    categorySlug: "amino-acids",
    productType: "Amino Acid",
    shortDescription: "5g pure L-glutamine per serving to support recovery between sessions.",
    description:
      "L-Glutamine is the most abundant amino acid in muscle tissue and among the first depleted by hard training. 5g per serving supports recovery and gut health between sessions. Unflavoured, single-ingredient, and mixes clear into water or into your existing shake.",
    goal: ["recovery", "general_health"],
    dietaryTags: ["vegan", "vegetarian", "gluten_free"],
    sections: ["best_seller"],
    sizes: [
      { weight: "250g", price: 1899, discountPrice: 1299, stock: 96, sku: "MDN-GLUT-250G", servings: 50, supplyLabel: "1.5-month supply" },
      { weight: "500g", price: 3299, discountPrice: 2299, stock: 52, sku: "MDN-GLUT-500G", servings: 100, supplyLabel: "3-month supply" },
    ],
    flavors: [],
    nutrition: {
      servingSize: "5g (1 scoop)",
      servingsPerContainer: 50,
      calories: 20,
      protein: 5,
      carbs: 0,
      fats: 0,
      sugar: 0,
      otherNutrients: [{ name: "L-Glutamine", amount: "5000mg" }],
    },
    ingredients: "100% L-Glutamine. Gluten free, non-GMO.",
    directionsOfUse:
      "Mix 1 scoop (5g) into 200ml water. Take post-workout, or before bed on rest days. Can be stacked with whey protein in the same shake.",
    whoIsThisFor: "Lifters training at high volume or frequency who feel recovery lagging between sessions.",
    images: ["l-glutamine.jpg", "l-glutamine-2.jpg"],
    tags: ["glutamine", "l-glutamine", "amino acids", "recovery", "supplements"],
  },
  {
    name: "MDN Presix Advance Pre-Workout",
    slug: "presix-advance",
    categorySlug: "pre-workout",
    productType: "Pre-Workout",
    shortDescription: "Green apple pre-workout for clean energy, focus and pumps — no crash.",
    description:
      "Presix Advance is a full-dose pre-workout built around caffeine, beta-alanine and citrulline for energy, endurance and blood flow, without the jittery spike-and-crash of an over-caffeinated formula. Every active is disclosed on the label at its actual dose — no proprietary blend hiding under-dosed ingredients.",
    goal: ["endurance", "muscle_gain"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["best_seller", "new_arrival"],
    isFeatured: true,
    sizes: [
      { weight: "300g", price: 2799, discountPrice: 1899, stock: 84, sku: "MDN-PRESIX-300G", servings: 37, supplyLabel: "1-month supply" },
    ],
    flavors: [
      { name: "Green Apple", priceAdjustment: 0 },
      { name: "Watermelon", priceAdjustment: 0 },
    ],
    nutrition: {
      servingSize: "8g (1 scoop)",
      servingsPerContainer: 37,
      calories: 12,
      protein: 0,
      carbs: 2.4,
      fats: 0,
      sugar: 0,
      otherNutrients: [
        { name: "L-Citrulline", amount: "3000mg" },
        { name: "Beta-Alanine", amount: "2000mg" },
        { name: "Caffeine Anhydrous", amount: "200mg" },
        { name: "L-Arginine", amount: "1000mg" },
      ],
    },
    ingredients:
      "L-Citrulline, Beta-Alanine, L-Arginine, Caffeine Anhydrous, Taurine, Natural & Nature-Identical Flavouring Substances, Acidity Regulator (INS 330), Sweetener (INS 955).",
    directionsOfUse:
      "Mix 1 scoop (8g) into 250ml cold water and take 20-30 minutes before training. Start with half a scoop to assess tolerance. Do not take within 6 hours of bedtime.",
    warnings:
      "Contains 200mg caffeine per serving. Start with half a serving to check your tolerance. Not recommended alongside other caffeinated products. " + STANDARD_WARNING,
    whoIsThisFor: "Lifters who train hard and want a disclosed-dose pre-workout rather than a caffeine bomb.",
    images: ["presix-advance.jpg", "presix-advance-2.jpg"],
    tags: ["pre workout", "preworkout", "pre-workout", "energy", "supplements"],
  },
  {
    name: "MDN Pre Pre-Workout",
    slug: "pre-workout",
    categorySlug: "pre-workout",
    productType: "Pre-Workout",
    shortDescription: "Mango pre-workout fuel — science-backed actives, honest dosing.",
    description:
      "MDN Pre is the everyday pre-workout in the range: enough caffeine and citrulline to sharpen a session without leaving you wired for hours afterwards. A lighter caffeine dose than Presix Advance, which makes it the better pick for evening training or for anyone caffeine-sensitive.",
    goal: ["endurance", "muscle_gain"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["new_arrival"],
    sizes: [
      { weight: "250g", price: 2299, discountPrice: 1599, stock: 110, sku: "MDN-PRE-250G", servings: 40, supplyLabel: "1-month supply" },
    ],
    flavors: [
      { name: "Mango", priceAdjustment: 0 },
      { name: "Blue Raspberry", priceAdjustment: 0 },
    ],
    nutrition: {
      servingSize: "6g (1 scoop)",
      servingsPerContainer: 40,
      calories: 10,
      protein: 0,
      carbs: 2,
      fats: 0,
      sugar: 0,
      otherNutrients: [
        { name: "L-Citrulline", amount: "2000mg" },
        { name: "Beta-Alanine", amount: "1600mg" },
        { name: "Caffeine Anhydrous", amount: "150mg" },
      ],
    },
    ingredients:
      "L-Citrulline, Beta-Alanine, Caffeine Anhydrous, Taurine, Natural & Nature-Identical Flavouring Substances, Sweetener (INS 955).",
    directionsOfUse:
      "Mix 1 scoop (6g) into 250ml cold water, 20-30 minutes before training. Begin with half a serving to assess tolerance.",
    warnings:
      "Contains 150mg caffeine per serving. Start with half a serving to check your tolerance. " + STANDARD_WARNING,
    whoIsThisFor: "Anyone wanting a moderate, everyday pre-workout — including evening trainers.",
    images: ["pre-workout.jpg", "pre-workout-2.jpg"],
    tags: ["pre workout", "preworkout", "pre-workout", "energy", "supplements"],
  },
  {
    name: "MDN Liquid Pre-Workout",
    slug: "liquid-pre-workout",
    categorySlug: "pre-workout",
    productType: "Pre-Workout",
    shortDescription: "Ready-to-drink black currant pre-workout — no scoop, no shaker.",
    description:
      "A liquid pre-workout for people who'd rather not carry a tub and shaker. One 15ml measure delivers the same actives as a powdered serving, absorbs fast, and can be taken straight or diluted. Black currant flavour, no added sugar.",
    goal: ["endurance"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["new_arrival"],
    sizes: [
      { weight: "300ml", price: 1899, discountPrice: 1299, stock: 72, sku: "MDN-LIQPRE-300ML", servings: 20, supplyLabel: "20 servings" },
    ],
    flavors: [{ name: "Black Currant", priceAdjustment: 0 }],
    nutrition: {
      servingSize: "15ml",
      servingsPerContainer: 20,
      calories: 8,
      protein: 0,
      carbs: 1.5,
      fats: 0,
      sugar: 0,
      otherNutrients: [
        { name: "L-Citrulline", amount: "1500mg" },
        { name: "Caffeine", amount: "120mg" },
        { name: "Taurine", amount: "500mg" },
      ],
    },
    ingredients:
      "Purified Water, L-Citrulline, Taurine, Caffeine, Natural Flavouring Substances, Preservative (INS 202), Sweetener (INS 955).",
    directionsOfUse:
      "Shake well before use. Take 15ml straight or mixed into 150ml water, 20 minutes before training. Refrigerate after opening and use within 30 days.",
    warnings: "Contains 120mg caffeine per serving. Refrigerate after opening. " + STANDARD_WARNING,
    whoIsThisFor: "Commuters and gym-bag minimalists who want pre-workout without mixing powder.",
    images: ["liquid-pre-workout.jpg", "liquid-pre-workout-2.jpg"],
    tags: ["pre workout", "liquid pre workout", "energy", "supplements"],
  },
  {
    name: "MDN Muscle Power & Recovery",
    slug: "muscle-power-recovery",
    categorySlug: "amino-acids",
    productType: "BCAA",
    shortDescription: "BCAA and electrolyte blend for intra-workout hydration and recovery.",
    description:
      "A BCAA-led intra-workout formula with added electrolytes to replace what you sweat out over a long session. The 2:1:1 leucine ratio supports recovery, while the electrolyte blend keeps hydration steady through longer or hotter training. Sip through the session rather than taking it all at once.",
    goal: ["recovery", "endurance"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["new_arrival"],
    sizes: [
      { weight: "400ml", price: 2099, discountPrice: 1449, stock: 66, sku: "MDN-MPR-400ML", servings: 26, supplyLabel: "26 servings" },
    ],
    flavors: [{ name: "Mixed Fruit", priceAdjustment: 0 }],
    nutrition: {
      servingSize: "15ml",
      servingsPerContainer: 26,
      calories: 14,
      protein: 3,
      carbs: 0.5,
      fats: 0,
      sugar: 0,
      otherNutrients: [
        { name: "BCAA (2:1:1)", amount: "3000mg" },
        { name: "Electrolyte Blend", amount: "250mg" },
        { name: "L-Glutamine", amount: "500mg" },
      ],
    },
    ingredients:
      "Purified Water, L-Leucine, L-Isoleucine, L-Valine, L-Glutamine, Electrolyte Blend (Sodium, Potassium, Magnesium), Natural Flavouring Substances, Preservative (INS 202).",
    directionsOfUse:
      "Mix 15ml into 500ml of water and sip through your training session. Can also be taken immediately post-workout.",
    whoIsThisFor: "Endurance athletes and anyone training long sessions or in hot conditions.",
    images: ["muscle-power-recovery.jpg", "muscle-power-recovery-2.jpg"],
    tags: ["bcaa", "amino acids", "recovery", "intra workout", "supplements"],
  },
  {
    name: "MDN L-Carnitine 3000 Liquid",
    slug: "l-carnitine-3000",
    categorySlug: "fat-burner",
    productType: "Fat Burner",
    shortDescription: "3000mg liquid L-carnitine to support fat metabolism — stimulant free.",
    description:
      "L-Carnitine supports the transport of fatty acids into cells to be burned for energy, which makes it a useful non-stimulant addition to a calorie deficit. Liquid form absorbs faster than capsules, and because there's no caffeine here it stacks safely with a pre-workout or can be taken in the evening.",
    goal: ["weight_loss", "endurance"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["fitness_combo"],
    sizes: [
      { weight: "300ml", price: 1799, discountPrice: 1199, stock: 88, sku: "MDN-CARN-300ML", servings: 30, supplyLabel: "1-month supply" },
    ],
    flavors: [{ name: "Black Currant", priceAdjustment: 0 }],
    nutrition: {
      servingSize: "10ml",
      servingsPerContainer: 30,
      calories: 5,
      protein: 0,
      carbs: 1,
      fats: 0,
      sugar: 0,
      otherNutrients: [{ name: "L-Carnitine L-Tartrate", amount: "3000mg" }],
    },
    ingredients:
      "Purified Water, L-Carnitine L-Tartrate, Natural Flavouring Substances, Acidity Regulator (INS 330), Preservative (INS 202), Sweetener (INS 955).",
    directionsOfUse:
      "Take 10ml 30 minutes before cardio or training, on an empty stomach where possible. Shake well before use.",
    whoIsThisFor: "Anyone in a calorie deficit who wants a stimulant-free addition to their cut.",
    images: ["l-carnitine-3000.jpg", "l-carnitine-3000-2.jpg"],
    tags: ["fat burner", "l-carnitine", "carnitine", "fat loss", "supplements"],
  },
  {
    name: "MDN Hydroxy Fat Cutter Pro",
    slug: "hydroxy-fat-cutter",
    categorySlug: "fat-burner",
    productType: "Fat Burner",
    shortDescription: "Garcinia, green coffee and L-carnitine capsules to support a cut.",
    description:
      "A capsule-format fat burner combining Garcinia Cambogia, Green Coffee Bean extract and L-Carnitine to support metabolism and appetite control alongside a calorie deficit. This is a support supplement, not a substitute for the deficit itself — it works when your training and diet already do.",
    goal: ["weight_loss"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["new_arrival", "fitness_combo"],
    sizes: [
      { weight: "60 capsules", price: 1699, discountPrice: 1099, stock: 104, sku: "MDN-HYDRO-60C", servings: 30, supplyLabel: "1-month supply" },
    ],
    flavors: [],
    nutrition: {
      servingSize: "2 capsules",
      servingsPerContainer: 30,
      calories: 4,
      protein: 0,
      carbs: 1,
      fats: 0,
      sugar: 0,
      otherNutrients: [
        { name: "Garcinia Cambogia Extract", amount: "500mg" },
        { name: "Green Coffee Bean Extract", amount: "400mg" },
        { name: "L-Carnitine", amount: "250mg" },
      ],
    },
    ingredients:
      "Garcinia Cambogia Extract, Green Coffee Bean Extract, L-Carnitine, Green Tea Extract, Gelatin Capsule Shell, Anticaking Agent (INS 470i).",
    directionsOfUse:
      "Take 1 capsule twice daily, 30 minutes before meals, with a glass of water. Do not exceed 2 capsules in 24 hours.",
    whoIsThisFor: "People already in a structured calorie deficit who want additional metabolic support.",
    images: ["hydroxy-fat-cutter.jpg", "hydroxy-fat-cutter-2.jpg"],
    tags: ["fat burner", "fat cutter", "garcinia", "weight loss", "fat loss", "supplements"],
  },
  {
    name: "MDN Liv-No-Fat",
    slug: "liv-no-fat",
    categorySlug: "fat-burner",
    productType: "Fat Burner",
    shortDescription: "Liver support and metabolism formula with milk thistle and dandelion.",
    description:
      "Liv-No-Fat targets metabolism from the liver side, combining milk thistle, dandelion root and choline to support normal liver function and fat metabolism. A sensible companion to a cutting phase, particularly if you're running a higher-protein diet.",
    goal: ["weight_loss", "general_health"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["fitness_combo"],
    sizes: [
      { weight: "60 capsules", price: 1599, discountPrice: 999, stock: 78, sku: "MDN-LIVNF-60C", servings: 60, supplyLabel: "2-month supply" },
    ],
    flavors: [],
    nutrition: {
      servingSize: "1 capsule",
      servingsPerContainer: 60,
      calories: 2,
      protein: 0,
      carbs: 0.5,
      fats: 0,
      sugar: 0,
      otherNutrients: [
        { name: "Milk Thistle Extract", amount: "300mg" },
        { name: "Dandelion Root Extract", amount: "200mg" },
        { name: "Choline Bitartrate", amount: "100mg" },
      ],
    },
    ingredients:
      "Milk Thistle Extract, Dandelion Root Extract, Choline Bitartrate, Artichoke Extract, Gelatin Capsule Shell.",
    directionsOfUse: "Take 1 capsule daily after a meal with water, or as directed by a healthcare professional.",
    whoIsThisFor: "Anyone on a long cutting phase or a sustained high-protein diet.",
    images: ["liv-no-fat.jpg", "liv-no-fat-2.jpg"],
    tags: ["fat burner", "liver support", "metabolism", "weight loss", "supplements"],
  },
  {
    name: "MDN Multivitamin",
    slug: "multivitamin",
    categorySlug: "wellness",
    productType: "Multivitamin",
    shortDescription: "Daily multivitamin and mineral support for active individuals.",
    description:
      "A daily multivitamin formulated for people who train, covering the vitamins and minerals most commonly run down by heavy activity and restricted diets. One tablet a day alongside food — straightforward coverage rather than a mega-dose of everything.",
    goal: ["general_health"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["fitness_combo"],
    sizes: [
      { weight: "60 tablets", price: 1299, discountPrice: 849, stock: 156, sku: "MDN-MULTI-60T", servings: 60, supplyLabel: "2-month supply" },
    ],
    flavors: [],
    nutrition: {
      servingSize: "1 tablet",
      servingsPerContainer: 60,
      calories: 2,
      protein: 0,
      carbs: 0.4,
      fats: 0,
      sugar: 0,
      otherNutrients: [
        { name: "Vitamin C", amount: "80mg" },
        { name: "Vitamin D3", amount: "600 IU" },
        { name: "Vitamin B12", amount: "2.4mcg" },
        { name: "Zinc", amount: "11mg" },
        { name: "Magnesium", amount: "60mg" },
      ],
    },
    ingredients:
      "Vitamin & Mineral Premix (Vitamins A, C, D3, E, B-Complex; Zinc, Magnesium, Iron, Selenium), Microcrystalline Cellulose, Anticaking Agent (INS 470i).",
    directionsOfUse: "Take 1 tablet daily with a meal. Do not exceed the recommended dose.",
    whoIsThisFor: "Active individuals wanting reliable daily micronutrient cover.",
    images: ["multivitamin.jpg", "multivitamin-2.jpg"],
    tags: ["multivitamin", "vitamins", "wellness", "immunity", "supplements"],
  },
  {
    name: "MDN Testo Pro",
    slug: "testo-pro",
    categorySlug: "wellness",
    productType: "Testosterone Booster",
    shortDescription: "Natural testosterone support with ashwagandha, shilajit and zinc.",
    description:
      "Testo Pro combines ashwagandha, shilajit, zinc and fenugreek to support the body's own testosterone production, energy and training drive. Herbal support rather than hormonal — expect gradual effects over weeks, not overnight.",
    goal: ["muscle_gain", "general_health"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["new_arrival"],
    sizes: [
      { weight: "60 capsules", price: 2199, discountPrice: 1449, stock: 62, sku: "MDN-TESTO-60C", servings: 30, supplyLabel: "1-month supply" },
    ],
    flavors: [],
    nutrition: {
      servingSize: "2 capsules",
      servingsPerContainer: 30,
      calories: 5,
      protein: 0,
      carbs: 1,
      fats: 0,
      sugar: 0,
      otherNutrients: [
        { name: "Ashwagandha Extract", amount: "600mg" },
        { name: "Shilajit Extract", amount: "250mg" },
        { name: "Fenugreek Extract", amount: "200mg" },
        { name: "Zinc", amount: "15mg" },
      ],
    },
    ingredients:
      "Ashwagandha Root Extract, Purified Shilajit Extract, Fenugreek Seed Extract, Zinc Gluconate, Gelatin Capsule Shell.",
    directionsOfUse:
      "Take 2 capsules daily with water, preferably after a meal. Use consistently for at least 8 weeks for a fair assessment.",
    whoIsThisFor: "Men over 25 looking for natural support for energy, drive and training output.",
    images: ["testo-pro.jpg", "testo-pro-2.jpg"],
    tags: ["testosterone", "testo booster", "ashwagandha", "wellness", "supplements"],
  },
  {
    name: "MDN Golden Omega 3",
    slug: "golden-omega-3",
    categorySlug: "wellness",
    productType: "Omega 3",
    shortDescription: "1000mg deep sea fish oil with 180mg EPA and 120mg DHA per softgel.",
    description:
      "Deep sea fish oil softgels delivering 1000mg of omega-3 fatty acids with a standard 180mg EPA / 120mg DHA split, supporting heart, joint and brain health. Molecularly distilled to remove heavy metals, and enteric-coated so there's no fishy repeat.",
    goal: ["general_health", "recovery"],
    dietaryTags: ["gluten_free"],
    sections: ["new_arrival", "fitness_combo"],
    sizes: [
      { weight: "60 softgels", price: 1399, discountPrice: 899, stock: 142, sku: "MDN-OMEGA-60S", servings: 60, supplyLabel: "2-month supply" },
    ],
    flavors: [],
    nutrition: {
      servingSize: "1 softgel",
      servingsPerContainer: 60,
      calories: 10,
      protein: 0,
      carbs: 0,
      fats: 1,
      sugar: 0,
      otherNutrients: [
        { name: "Fish Oil", amount: "1000mg" },
        { name: "EPA", amount: "180mg" },
        { name: "DHA", amount: "120mg" },
      ],
    },
    ingredients: "Deep Sea Fish Oil, Gelatin, Glycerin, Purified Water, Natural Tocopherol (antioxidant).",
    directionsOfUse: "Take 1 softgel daily with a meal, or as directed by a healthcare professional.",
    warnings: "Contains fish. Avoid if you have a seafood allergy. " + STANDARD_WARNING,
    whoIsThisFor: "Anyone whose diet is light on oily fish — which is most people who train.",
    images: ["golden-omega-3.jpg", "golden-omega-3-2.jpg"],
    tags: ["omega 3", "fish oil", "epa dha", "wellness", "supplements"],
  },
  {
    name: "MDN Shilajit Resin",
    slug: "shilajit-resin",
    categorySlug: "wellness",
    productType: "Wellness",
    shortDescription: "Himalayan purified shilajit resin for stamina, energy and recovery.",
    description:
      "Purified Himalayan shilajit resin, rich in fulvic acid and trace minerals, traditionally used to support stamina, energy and recovery. Supplied as a resin rather than a powder or capsule because it's the least processed format — a pea-sized portion dissolved in warm water or milk is a full serving.",
    goal: ["general_health", "endurance", "recovery"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["best_seller", "new_arrival"],
    isFeatured: true,
    sizes: [
      { weight: "20g", price: 1899, discountPrice: 1249, stock: 94, sku: "MDN-SHIL-20G", servings: 40, supplyLabel: "1.5-month supply" },
      { weight: "50g", price: 3999, discountPrice: 2699, stock: 46, sku: "MDN-SHIL-50G", servings: 100, supplyLabel: "3-month supply" },
    ],
    flavors: [],
    nutrition: {
      servingSize: "300-500mg (pea-sized)",
      servingsPerContainer: 40,
      calories: 2,
      protein: 0,
      carbs: 0.3,
      fats: 0,
      sugar: 0,
      otherNutrients: [
        { name: "Fulvic Acid", amount: "Min. 60mg" },
        { name: "Trace Minerals", amount: "84+ naturally occurring" },
      ],
    },
    ingredients: "100% Purified Himalayan Shilajit Resin. No fillers or additives.",
    directionsOfUse:
      "Dissolve a pea-sized portion (300-500mg) in warm water or milk once daily, preferably in the morning. Use the spoon provided.",
    whoIsThisFor: "Anyone wanting a traditional daily tonic for energy and stamina alongside training.",
    images: ["shilajit-resin.jpg", "shilajit-resin-2.jpg"],
    tags: ["shilajit", "fulvic acid", "stamina", "wellness", "supplements"],
  },

  // ---------- Combos (fitness_combo / "Bundles & Offers") ----------
  {
    name: "MDN Muscle Builder Combo",
    slug: "combo-muscle-builder",
    categorySlug: "combos",
    productType: "Combo",
    shortDescription: "Whey Protein + Creatine Monohydrate + L-Glutamine — the core mass stack.",
    description:
      "The three supplements with the strongest evidence behind them, bundled at a saving over buying them separately. Whey for your daily protein target, creatine for strength and power output, glutamine for recovery between sessions. This is the stack to start with if you're building one — everything else is optional on top.",
    goal: ["muscle_gain", "recovery"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["fitness_combo", "best_seller"],
    isFeatured: true,
    sizes: [
      { weight: "Starter (1kg Whey + 100g Creatine + 250g Glutamine)", price: 7497, discountPrice: 4999, stock: 40, sku: "MDN-COMBO-MB-S", servings: 28, supplyLabel: "1-month stack" },
      { weight: "Pro (2kg Whey + 250g Creatine + 500g Glutamine)", price: 13497, discountPrice: 8999, stock: 22, sku: "MDN-COMBO-MB-P", servings: 60, supplyLabel: "2-month stack" },
    ],
    flavors: [
      { name: "Chocolate Whey", priceAdjustment: 0 },
      { name: "Malai Kulfi Whey", priceAdjustment: 100 },
    ],
    nutrition: {
      servingSize: "See individual products",
      servingsPerContainer: 28,
      otherNutrients: [
        { name: "Whey Protein per scoop", amount: "24g" },
        { name: "Creatine Monohydrate per scoop", amount: "3g" },
        { name: "L-Glutamine per scoop", amount: "5g" },
      ],
    },
    ingredients:
      "Contains MDN Whey Protein, MDN Creatine Monohydrate and MDN L-Glutamine. See each product page for its full ingredient list.",
    directionsOfUse:
      "Whey: 1 scoop post-workout. Creatine: 1 scoop (3g) daily, including rest days. Glutamine: 1 scoop (5g) post-workout or before bed. Creatine and glutamine can both be added to the whey shake.",
    whoIsThisFor: "Anyone building their first proper supplement stack, or restocking all three at once.",
    images: ["combo-muscle-builder.jpg", "combo-muscle-builder-2.jpg", "combo-muscle-builder-3.jpg", "combo-muscle-builder-4.jpg"],
    tags: ["combo", "stack", "bundle", "whey protein", "creatine", "glutamine", "supplements"],
  },
  {
    name: "MDN Fat Loss Starter Combo",
    slug: "combo-fat-loss",
    categorySlug: "combos",
    productType: "Combo",
    shortDescription: "Hydroxy Fat Cutter + L-Carnitine 3000 + Liv-No-Fat — the cutting stack.",
    description:
      "Three complementary products for a cutting phase: a capsule fat burner for metabolic and appetite support, stimulant-free liquid L-carnitine for fat transport around cardio, and Liv-No-Fat for liver support through a sustained deficit. None of these replace the calorie deficit — they support one you're already running.",
    goal: ["weight_loss"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["fitness_combo"],
    sizes: [
      { weight: "1-Month Stack", price: 5097, discountPrice: 2999, stock: 34, sku: "MDN-COMBO-FL-1M", servings: 30, supplyLabel: "1-month stack" },
    ],
    flavors: [],
    nutrition: {
      servingSize: "See individual products",
      servingsPerContainer: 30,
      otherNutrients: [
        { name: "Garcinia Cambogia per serving", amount: "500mg" },
        { name: "L-Carnitine per serving", amount: "3000mg" },
        { name: "Milk Thistle per capsule", amount: "300mg" },
      ],
    },
    ingredients:
      "Contains MDN Hydroxy Fat Cutter Pro, MDN L-Carnitine 3000 Liquid and MDN Liv-No-Fat. See each product page for its full ingredient list.",
    directionsOfUse:
      "Fat Cutter: 1 capsule twice daily before meals. L-Carnitine: 10ml 30 minutes before cardio. Liv-No-Fat: 1 capsule daily after a meal.",
    whoIsThisFor: "Anyone starting a structured cut who wants the supporting supplements in one go.",
    images: ["combo-fat-loss.jpg", "combo-fat-loss-2.jpg", "combo-fat-loss-3.jpg", "combo-fat-loss-4.jpg"],
    tags: ["combo", "stack", "bundle", "fat burner", "fat loss", "weight loss", "supplements"],
  },
  {
    name: "MDN Daily Wellness Combo",
    slug: "combo-daily-wellness",
    categorySlug: "combos",
    productType: "Combo",
    shortDescription: "Multivitamin + Golden Omega 3 + Shilajit Resin — everyday health cover.",
    description:
      "The non-training half of the equation: daily micronutrient cover, omega-3s for heart and joint health, and shilajit for energy and stamina. If you only take supplements around workouts, this is the stack that fills the rest of the week.",
    goal: ["general_health", "recovery"],
    dietaryTags: ["vegetarian", "gluten_free"],
    sections: ["fitness_combo"],
    sizes: [
      { weight: "2-Month Stack", price: 4597, discountPrice: 2599, stock: 48, sku: "MDN-COMBO-DW-2M", servings: 60, supplyLabel: "2-month stack" },
    ],
    flavors: [],
    nutrition: {
      servingSize: "See individual products",
      servingsPerContainer: 60,
      otherNutrients: [
        { name: "Vitamin D3 per tablet", amount: "600 IU" },
        { name: "Omega-3 per softgel", amount: "1000mg" },
        { name: "Fulvic Acid per serving", amount: "Min. 60mg" },
      ],
    },
    ingredients:
      "Contains MDN Multivitamin, MDN Golden Omega 3 and MDN Shilajit Resin. See each product page for its full ingredient list.",
    directionsOfUse:
      "Multivitamin: 1 tablet daily with a meal. Omega 3: 1 softgel daily with a meal. Shilajit: pea-sized portion in warm water each morning.",
    warnings: "Contains fish (Omega 3). Avoid if you have a seafood allergy. " + STANDARD_WARNING,
    whoIsThisFor: "Anyone wanting baseline daily health cover alongside their training supplements.",
    images: ["combo-daily-wellness.jpg", "combo-daily-wellness-2.jpg", "combo-daily-wellness-3.jpg", "combo-daily-wellness-4.jpg"],
    tags: ["combo", "stack", "bundle", "multivitamin", "omega 3", "shilajit", "wellness", "supplements"],
  },
];

async function main() {
  await connectDB();

  // Categories are upserted by slug rather than created blindly — the
  // storefront already had a "creatine" category, and slug is unique.
  const categoryIdBySlug = {};
  let catsCreated = 0;
  for (const c of CATEGORIES) {
    const existing = await Category.findOne({ slug: c.slug });
    if (existing) {
      categoryIdBySlug[c.slug] = existing._id;
      continue;
    }
    const created = await Category.create(c);
    categoryIdBySlug[c.slug] = created._id;
    catsCreated++;
  }
  console.log(`Categories: ${catsCreated} created, ${CATEGORIES.length - catsCreated} already present`);

  let created = 0;
  let skipped = 0;
  let replaced = 0;

  for (const p of PRODUCTS) {
    const existing = await Product.findOne({ slug: p.slug });
    if (existing && !FORCE) {
      skipped++;
      continue;
    }

    const { categorySlug, images, ...rest } = p;
    const doc = {
      ...rest,
      brand: "MDN",
      category: categoryIdBySlug[categorySlug],
      thumbnail: IMG(images[0]),
      images: images.map(IMG),
      posterTop: POSTER_TOP,
      posterBottom: POSTER_BOTTOM,
      warnings: p.warnings || STANDARD_WARNING,
      isActive: true,
      manufactureDate: MFG,
      expiryDate: EXP,
      seo: {
        metaTitle: `${p.name} — Buy Online | MDN My Daily Nutrition`,
        metaDescription: p.shortDescription,
      },
    };

    if (existing) {
      // --force: replace the demo fields but keep the existing _id, so any
      // cart or order already referencing this product stays valid.
      Object.assign(existing, doc);
      await existing.save();
      replaced++;
    } else {
      await Product.create(doc);
      created++;
    }
  }

  console.log(`Products: ${created} created, ${replaced} replaced, ${skipped} skipped (already existed)`);

  const counts = {};
  for (const section of ["best_seller", "new_arrival", "fitness_combo"]) {
    counts[section] = await Product.countDocuments({ isActive: true, sections: section });
  }
  console.log("Active products per section:", counts);
  console.log("Total active products:", await Product.countDocuments({ isActive: true }));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
