const crypto = require("crypto");
const router = require("express").Router();
const { isAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { limits } = require("../middleware/security");
const OtpCode = require("../models/OtpCode");
const User = require("../models/User");
const { otpSendBody, otpVerifyBody } = require("../validators/schemas");
const { sendOtp, channelMode } = require("../utils/otpSender");

// Checkout ke phone/email OTP. Verify hone par number/email user ke
// account pe "verified" list me jud jata hai — agli checkout pe dobara
// OTP nahi. Google login wala email pehle se verified maana jata hai.

const CODE_TTL_MS = 10 * 60 * 1000; // 10 min
const RESEND_AFTER_MS = 30 * 1000; // 30 sec baad hi naya code
const MAX_ATTEMPTS = 5;
const MAX_VERIFIED = 10; // har list me itne hi yaad rakho

const hashCode = (code, target) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET).update(`${target}:${code}`).digest("hex");

const sameHash = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

const LIST = { phone: "verifiedPhones", email: "verifiedEmails" };

router.use(isAuth);

// GET /api/otp/status — kaunse channel chalu hain + is user ke verified numbers/emails
router.get("/status", async (req, res) => {
  const user = await User.findById(req.user._id).select("email verifiedPhones verifiedEmails").lean();
  res.json({
    success: true,
    data: {
      phone: { enabled: channelMode("phone") !== "off", testMode: channelMode("phone") === "test" },
      email: { enabled: channelMode("email") !== "off", testMode: channelMode("email") === "test" },
      accountEmail: user.email,
      verifiedPhones: user.verifiedPhones || [],
      // Google wala email hamesha verified
      verifiedEmails: [...new Set([user.email, ...(user.verifiedEmails || [])])],
    },
  });
});

// POST /api/otp/send { channel, target }
router.post("/send", limits.otpSend, validate({ body: otpSendBody }), async (req, res) => {
  const { channel, target } = req.body;

  if (channel === "email" && target === req.user.email) {
    return res.json({ success: true, data: { alreadyVerified: true } });
  }

  const existing = await OtpCode.findOne({ user: req.user._id, channel, target });
  if (existing && Date.now() - existing.lastSentAt.getTime() < RESEND_AFTER_MS) {
    const wait = Math.ceil((RESEND_AFTER_MS - (Date.now() - existing.lastSentAt.getTime())) / 1000);
    return res.status(429).json({ success: false, message: `Please wait ${wait}s before requesting a new code`, retryAfter: wait });
  }

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const now = new Date();
  await OtpCode.findOneAndUpdate(
    { user: req.user._id, channel, target },
    { codeHash: hashCode(code, target), expiresAt: new Date(now.getTime() + CODE_TTL_MS), attempts: 0, lastSentAt: now },
    { upsert: true, new: true }
  );

  try {
    const { mode } = await sendOtp(channel, target, code);
    res.json({
      success: true,
      data: { sent: true, testMode: mode === "test", expiresIn: CODE_TTL_MS / 1000, resendIn: RESEND_AFTER_MS / 1000 },
    });
  } catch (err) {
    // Bhej nahi paye to code bhi hata do — warna resend 30s ruka rehta
    await OtpCode.deleteOne({ user: req.user._id, channel, target });
    console.error("OTP send failed:", err.message);
    res.status(err.status || 502).json({
      success: false,
      message: err.status ? err.message : `We couldn't send the code to your ${channel}. Please try again.`,
    });
  }
});

// POST /api/otp/verify { channel, target, code }
router.post("/verify", limits.otpVerify, validate({ body: otpVerifyBody }), async (req, res) => {
  const { channel, target, code } = req.body;
  const otp = await OtpCode.findOne({ user: req.user._id, channel, target });

  if (!otp || otp.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: "This code has expired. Please request a new one." });
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    return res.status(429).json({ success: false, message: "Too many wrong attempts. Please request a new code." });
  }
  if (!sameHash(otp.codeHash, hashCode(code, target))) {
    otp.attempts += 1;
    await otp.save();
    const left = MAX_ATTEMPTS - otp.attempts;
    return res.status(400).json({
      success: false,
      message: left > 0 ? `Incorrect code. ${left} attempt${left > 1 ? "s" : ""} left.` : "Too many wrong attempts. Please request a new code.",
    });
  }

  await OtpCode.deleteOne({ _id: otp._id });
  // List me sabse naya aage, purane kat jayein
  const user = await User.findById(req.user._id).select(LIST[channel]);
  user[LIST[channel]] = [target, ...(user[LIST[channel]] || []).filter((t) => t !== target)].slice(0, MAX_VERIFIED);
  await user.save({ validateModifiedOnly: true });

  res.json({ success: true, data: { verified: true, channel, target } });
});

module.exports = router;
