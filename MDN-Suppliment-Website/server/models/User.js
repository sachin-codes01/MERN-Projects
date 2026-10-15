const mongoose = require("mongoose");

// Aakhri line of defence: format ke strict rules (pincode pattern, min
// length) request schema (validators/schemas.js) me hain. Yahan sirf
// generous caps — login pe user.save() saare purane addresses dobara
// validate karta hai, strict rule lagate hi purane data wale users ka
// login toot jata.
const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home", trim: true, maxlength: 30 },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 15 },
    line1: { type: String, required: true, trim: true, maxlength: 300 },
    line2: { type: String, trim: true, maxlength: 300 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    district: { type: String, trim: true, maxlength: 100, default: "" },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    pincode: { type: String, required: true, trim: true, maxlength: 10 },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    googleId: { type: String, required: true, unique: true },
    avatar: { type: String },
    phone: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["customer", "admin", "superadmin"], default: "customer" },
    addresses: [addressSchema],
    fitnessGoal: {
      type: String,
      enum: ["weight_loss", "muscle_gain", "maintenance", "general_fitness"],
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    // Checkout pe OTP se verify kiye emails — dobara OTP nahi maangte
    verifiedEmails: { type: [String], default: [] },
    isBlocked: { type: Boolean, default: false },
    refreshToken: { type: String, select: false },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);