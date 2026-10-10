const mongoose = require("mongoose");

// Ek user + channel + target (phone/email) ke liye abhi ka OTP. Code plain
// nahi, sirf uska HMAC hash store hota hai. Expire hote hi Mongo khud
// document hata deta hai (TTL index).
const otpCodeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    channel: { type: String, enum: ["phone", "email"], required: true },
    target: { type: String, required: true, maxlength: 254 }, // 10-digit phone ya lowercase email
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 }, // galat code kitni baar daala
    lastSentAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpCodeSchema.index({ user: 1, channel: 1, target: 1 }, { unique: true });
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OtpCode", otpCodeSchema);
