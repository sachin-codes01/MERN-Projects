const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20 },
    discountType: { type: String, enum: ["percentage", "flat"], required: true },
    discountValue: {
      type: Number,
      required: true,
      min: [0, "Discount can't be negative"],
      validate: {
        validator: function (v) {
          // findByIdAndUpdate (runValidators) me `this` query hota hai — tab skip
          return typeof this.get !== "function" || this.get("discountType") !== "percentage" || v <= 100;
        },
        message: "A percentage discount can't be more than 100%",
      },
    },
    minOrderValue: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 }, // only relevant for percentage discounts
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);