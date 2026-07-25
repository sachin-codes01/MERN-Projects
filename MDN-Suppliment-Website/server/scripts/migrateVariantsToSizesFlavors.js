// One-off migration: the Product schema used to combine flavor+weight into
// a single `variants` array (each combo had its own price/stock/sku). It's
// now two independent lists — `sizes` (weight/price/stock/sku) and
// `flavors` (name/image/priceAdjustment) — so a customer picks a size and
// a flavor separately instead of flavor filtering which sizes show up.
//
// Runs directly against the raw collection (not the Mongoose model),
// because the old `variants` field no longer exists in the current schema
// — Mongoose would just silently ignore it on read.
//
// Also clears every cart: existing cart items point at an old variantId,
// which has no meaning under the new schema. Carts are transient data —
// nothing is lost that a customer can't just re-add.
//
// Usage: npm run migrate:sizes-flavors  (from server/)
require("dotenv").config();
const connectDB = require("../database");
const mongoose = require("mongoose");

async function run() {
  await connectDB();
  const db = mongoose.connection.db;
  const products = db.collection("products");

  const cursor = products.find({ variants: { $exists: true } });
  let migrated = 0;

  while (await cursor.hasNext()) {
    const product = await cursor.next();
    const variants = product.variants || [];

    const sizes = variants.map((v) => ({
      _id: v._id || new mongoose.Types.ObjectId(),
      weight: v.weight,
      price: v.price,
      discountPrice: v.discountPrice,
      stock: v.stock ?? 0,
      sku: v.sku,
      servings: v.servings,
      supplyLabel: v.supplyLabel,
    }));

    // Dedup flavors by name (case-insensitive) — every weight of the same
    // flavor used to repeat the same flavor name/image/adjustment, so keep
    // just the first occurrence of each.
    const flavors = [];
    const seen = new Set();
    for (const v of variants) {
      if (!v.flavor) continue;
      const key = v.flavor.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      flavors.push({
        _id: new mongoose.Types.ObjectId(),
        name: v.flavor,
        image: v.flavorImage || undefined,
        priceAdjustment: v.flavorPriceAdjustment || 0,
      });
    }

    await products.updateOne({ _id: product._id }, { $set: { sizes, flavors }, $unset: { variants: "" } });
    migrated++;
  }

  const cartResult = await db.collection("carts").deleteMany({});

  console.log(`Migrated ${migrated} product(s) from variants to sizes+flavors.`);
  console.log(`Cleared ${cartResult.deletedCount} cart(s) (stale variantId references).`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
