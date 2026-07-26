const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // "Protein", "Creatine", "Vitamins"
    // See Product.js slug for why this uses a custom setter instead of
    // just `lowercase`/`trim`.
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
    description: { type: String },
    image: { type: String },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null, // null = top-level category
    },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);