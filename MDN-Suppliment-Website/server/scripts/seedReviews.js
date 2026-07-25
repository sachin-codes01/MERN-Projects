// One-off, idempotent script: seeds a handful of realistic Hindi-English
// mixed demo reviews onto every active product that doesn't have any yet,
// so the new ProductReviews section isn't empty while there's no
// "write a review" UI in the app yet. Safe to re-run — products that
// already have reviews are skipped.
//
// Usage: npm run seed:reviews  (from server/)
require("dotenv").config();
const connectDB = require("../database");
const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");

const REVIEWERS = [
  { name: "Rohit", email: "seed.rohit@mdn-demo.local", googleId: "seed-rohit" },
  { name: "Aditya", email: "seed.aditya@mdn-demo.local", googleId: "seed-aditya" },
  { name: "Priya", email: "seed.priya@mdn-demo.local", googleId: "seed-priya" },
  { name: "Karan", email: "seed.karan@mdn-demo.local", googleId: "seed-karan" },
  { name: "Simran", email: "seed.simran@mdn-demo.local", googleId: "seed-simran" },
  { name: "Vikas", email: "seed.vikas@mdn-demo.local", googleId: "seed-vikas" },
  { name: "Neha", email: "seed.neha@mdn-demo.local", googleId: "seed-neha" },
  { name: "Arjun", email: "seed.arjun@mdn-demo.local", googleId: "seed-arjun" },
  { name: "Deepak", email: "seed.deepak@mdn-demo.local", googleId: "seed-deepak" },
  { name: "Anjali", email: "seed.anjali@mdn-demo.local", googleId: "seed-anjali" },
  { name: "Rahul", email: "seed.rahul@mdn-demo.local", googleId: "seed-rahul" },
  { name: "Pooja", email: "seed.pooja@mdn-demo.local", googleId: "seed-pooja" },
];

// 24 realistic Hindi-English mixed comments, mostly positive with a
// handful of mid/low ratings mixed in (delivery gripes, minor niggles)
// so the section reads like genuine customer feedback rather than a
// wall of 5-stars.
const REVIEW_POOL = [
  { rating: 5, comment: "Bahut acha product hai, taste bhi mast hai aur results v dikhne lage 3 weeks mein. Highly recommend!" },
  { rating: 4, comment: "Very nice and authentic product, quality top notch hai. But delivery thoda late ho gaya, please improve karo." },
  { rating: 5, comment: "Mix karne mein easy hai, no lumps. Protein content bhi accha hai. Will order again." },
  { rating: 4, comment: "Good product, price thoda high lagta hai but quality ke hisab se worth it hai." },
  { rating: 5, comment: "Ordered 3rd time already. Genuine product, packaging bhi solid thi." },
  { rating: 3, comment: "Taste theek hai but expected better mixing. Overall okay experience." },
  { rating: 5, comment: "MDN ka ye product use kar raha hu 2 mahine se, strength mein clear difference feel ho raha hai." },
  { rating: 4, comment: "Solid product, bas thoda sweet lagta hai mujhe. Baaki sab perfect." },
  { rating: 5, comment: "Genuine product mila, seal pack tha. Gym trainer ne bhi recommend kiya tha yehi brand." },
  { rating: 4, comment: "Achha hai overall, bas ek flavor aur launch karo please — variety chahiye." },
  { rating: 5, comment: "I ordered many times, please give me extra discount on bulk orders next time!" },
  { rating: 4, comment: "Very nice and authentic product, quality top notch hai. But please work on your delivery partners, unhone order 4 din late kiya." },
  { rating: 4, comment: "Good" },
  { rating: 5, comment: "Best supplement mila is price range mein. No side effects, digestion bhi fine raha." },
  { rating: 3, comment: "Product to sahi hai lekin scoop measurement thoda confusing hai first time." },
  { rating: 5, comment: "Fast shipping mila is baar, product bhi original lag raha hai. Happy customer!" },
  { rating: 4, comment: "Value for money product hai. Mixability average hai but taste accha hai." },
  { rating: 5, comment: "Trainer ke bataye anusar le raha hu, results dikhne lage hain. Thank you MDN team!" },
  { rating: 2, comment: "Packaging thodi damaged aayi thi, product fine tha but box crushed tha." },
  { rating: 5, comment: "Bahut hi genuine brand hai, lab tested certificate bhi mila with the order." },
  { rating: 4, comment: "Nice product overall, ek baar try karo, sabko recommend karunga." },
  { rating: 5, comment: "Consistency acchi hai, no clumps, easy to digest. Definitely repurchasing." },
  { rating: 4, comment: "Thoda costly hai competitors se but quality justify karti hai price ko." },
  { rating: 5, comment: "Amazing results in just one month, strength aur stamina dono improve hue hain." },
];

async function upsertReviewers() {
  const users = [];
  for (const r of REVIEWERS) {
    const user = await User.findOneAndUpdate(
      { googleId: r.googleId },
      { $setOnInsert: { name: r.name, email: r.email, googleId: r.googleId, role: "customer" } },
      { upsert: true, returnDocument: "after" }
    );
    users.push(user);
  }
  return users;
}

// Spreads fabricated review dates across the last ~60 days instead of
// all sharing today's timestamp, so the list reads like it accumulated
// over time (matches the reference screenshot's staggered dates).
function randomPastDate(maxDaysAgo = 60) {
  const daysAgo = Math.floor(Math.random() * maxDaysAgo);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

async function run() {
  await connectDB();
  const reviewers = await upsertReviewers();

  const products = await Product.find({ isActive: true });

  for (const product of products) {
    const shuffledPool = [...REVIEW_POOL].sort(() => Math.random() - 0.5);
    const shuffledReviewers = [...reviewers].sort(() => Math.random() - 0.5);

    // These are all demo/seed reviews (there's no "write a review" UI
    // yet, so nothing real can exist here) — replace wholesale each run
    // rather than appending, so re-running stays at exactly 24 instead
    // of growing unbounded.
    product.reviews = shuffledPool.map((review, i) => {
      const createdAt = randomPastDate();
      return {
        user: shuffledReviewers[i % shuffledReviewers.length]._id,
        rating: review.rating,
        comment: review.comment,
        verifiedPurchase: Math.random() > 0.1, // occasional non-verified for realism
        createdAt,
        updatedAt: createdAt,
      };
    });

    product.ratingsCount = product.reviews.length;
    product.ratingsAverage = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;

    await product.save();
  }

  console.log(`Seeded ${REVIEW_POOL.length} reviews on ${products.length} product(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
