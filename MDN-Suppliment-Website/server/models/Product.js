const mongoose = require("mongoose");

// Each product can have multiple buyable variants (flavor + weight combo)
const variantSchema = new mongoose.Schema(
  {
    flavor: { type: String }, // e.g. "Chocolate", "Unflavored"
    weight: { type: String, required: true }, // e.g. "1kg", "500g", "60 capsules"
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    stock: { type: Number, required: true, default: 0 },
    sku: { type: String, required: true, unique: true },
    images: [{ type: String }],
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
    slug: { type: String, required: true, unique: true, lowercase: true },
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

    variants: { type: [variantSchema], validate: (v) => v.length > 0 },

    nutrition: nutritionSchema,
    ingredients: { type: String }, // full ingredient list text
    directionsOfUse: { type: String },
    warnings: { type: String },

    thumbnail: { type: String, required: true },
    images: [{ type: String }],

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