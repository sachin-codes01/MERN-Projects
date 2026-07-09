const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" }, // Home, Work, etc.
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false, minlength: 6 },
    phone: { type: String, unique: true, sparse: true },

    role: {
      type: String,
      enum: ["customer", "admin", "superadmin"],
      default: "customer",
    },

    avatar: { type: String }, // image URL
    addresses: [addressSchema],

    // Fitness-goal targeting — useful for supplement recommendations
    fitnessGoal: {
      type: String,
      enum: ["weight_loss", "muscle_gain", "maintenance", "general_fitness"],
    },

    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },

    // Auth helpers
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    refreshToken: { type: String, select: false },

    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);