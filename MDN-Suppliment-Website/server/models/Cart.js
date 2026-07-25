const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    sizeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // Flavor is optional (products without flavor variety) and carries no
    // stock of its own — it's just a price delta + display label on top
    // of whichever size is selected.
    flavorId: { type: mongoose.Schema.Types.ObjectId, default: null },
    flavor: { type: String, default: null }, // denormalized name, so the cart can render without a product lookup
    quantity: { type: Number, required: true, min: 1, default: 1 },
    priceAtAddition: { type: Number, required: true },
  }
  // _id: true (default) — each line's own id addresses it for update/remove,
  // since (product, sizeId) alone isn't unique when the same size is in
  // the cart with two different flavors.
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
    couponApplied: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);