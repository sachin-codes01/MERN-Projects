const mongoose = require("mongoose");

// Pack sizes and flavors are independent choices (not a combined
// flavor+weight matrix) — a customer picks a size AND, separately, a
// flavor. Stock/SKU/price live on the size; a flavor only ever adds a
// price delta on top and carries its own swatch photo. There is a single
// shared stock pool per size across every flavor.
const sizeSchema = new mongoose.Schema(
  {
    weight: { type: String, required: true }, // e.g. "1kg", "500g", "60 capsules"
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    stock: { type: Number, required: true, default: 0 },
    // Uniqueness is enforced per-product client-side (AdminProducts.jsx
    // validateSizes) — NOT `unique: true` here. Mongoose turns a
    // unique:true on a field inside an embedded array into a
    // collection-wide index (sizes.sku unique across every product's
    // every size), which silently fails saves the moment two DIFFERENT
    // products happen to reuse the same SKU pattern.
    sku: { type: String, required: true },
    servings: { type: Number }, // optional — powers "N servings" + per-serving price on the size cards
    supplyLabel: { type: String }, // optional free text, e.g. "2-month supply"
  },
  { _id: true }
);

const flavorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Chocolate", "Unflavored"
    image: { type: String }, // swatch photo for the flavor picker
    // Added on top of whichever size is selected to get the final,
    // customer-facing price (e.g. size price 500 + 50 for Chocolate =
    // 550). Set once per flavor here — not re-entered per size.
    priceAdjustment: { type: Number, default: 0 },
  },
  { _id: true }
);

const nutritionSchema = new mongoose.Schema(
  {
    servingSize: { type: String }, // "30g (1 scoop)"
    servingsPerContainer: { type: Number },
    calories: { type: Number },
    protein: { type: Number }, // grams
    carbs: { type: Number },
    fats: { type: Number },
    sugar: { type: Number },
    otherNutrients: [
      {
        name: { type: String }, // e.g. "Creatine Monohydrate"
        amount: { type: String }, // e.g. "5g"
      },
    ],
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    images: [{ type: String }],
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Custom setter (not just `lowercase`/`trim`) so a slug typed with spaces
    // or mixed case in the admin form always lands as a clean, URL-safe
    // "mdn-collagen" — not "mdn collagen " — which would 404 on the storefront
    // since GET /products/:slug does an exact string match. Runs on both
    // Product.create() AND findByIdAndUpdate(), since Mongoose applies
    // SchemaType setters on update casting too, not just on .save().
    slug: {
      type: String,
      required: true,
      unique: true,
      set: (v) =>
        typeof v === "string"
          ? v
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
          : v,
    },
    description: { type: String, required: true },
    shortDescription: { type: String },

    brand: { type: String, required: true },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // e.g. "Whey Protein", "Creatine", "Mass Gainer", "BCAA", "Pre-Workout"
    productType: { type: String, required: true },

    goal: [
      {
        type: String,
        enum: ["muscle_gain", "weight_loss", "endurance", "recovery", "general_health"],
      },
    ],

    dietaryTags: [
      { type: String, enum: ["vegan", "vegetarian", "gluten_free", "lactose_free", "keto"] },
    ],

    // Which homepage sections this product appears in (customer-facing storefront grouping)
    sections: {
      type: [String],
      enum: ["best_seller", "new_arrival", "fitness_combo"],
      default: [],
    },

    sizes: { type: [sizeSchema], validate: (v) => v.length > 0 },
    flavors: { type: [flavorSchema], default: [] }, // optional — products without flavor variety just leave this empty

    nutrition: nutritionSchema,
    ingredients: { type: String }, // full ingredient list text
    directionsOfUse: { type: String },
    warnings: { type: String },
    whoIsThisFor: { type: String }, // PDP "Who is this for?" accordion content

    thumbnail: { type: String, required: true },
    images: [{ type: String }],
    posterTop: { type: String }, // PDP bottom promo block — full-width, shorter poster
    posterBottom: { type: String }, // PDP bottom promo block — bigger poster

    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
    reviews: [reviewSchema],

    tags: [{ type: String }], // for search
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    manufactureDate: { type: Date },
    expiryDate: { type: Date },

    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
    },
  },
  { timestamps: true }
);

productSchema.index(
  { name: "text", brand: "text", tags: "text", productType: "text" },
  { weights: { name: 10, brand: 5, tags: 5, productType: 3 }, name: "product_search_index" }
);

module.exports = mongoose.model("Product", productSchema);