const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

/* ---------- NoSQL injection guard ----------
   `{"email": {"$gt": ""}}` jaisa body seedha Mongo query me pahunche to
   operator ban jata hai. express-mongo-sanitize Express 5 pe nahi chalta
   (wahan req.query read-only getter hai), isliye apna chhota version:
   koi bhi key jo "$" se shuru ho ya jisme "." ho — poori request 400.
   Silently hata dene se behtar reject karna hai: asli client kabhi aisa
   nahi bhejta, to aisi request sirf attack hi ho sakti hai. */
const findBadKey = (value, depth = 0) => {
  if (depth > 20 || value === null || typeof value !== "object") return null;
  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) return key;
    const nested = findBadKey(value[key], depth + 1);
    if (nested) return nested;
  }
  return null;
};

const rejectMongoOperators = (req, res, next) => {
  for (const part of ["body", "query", "params"]) {
    const bad = findBadKey(req[part]);
    if (bad) {
      return res.status(400).json({
        success: false,
        message: "Request contains a forbidden key",
        errors: [{ field: `${part}.${bad}`, message: "Keys starting with $ or containing . are not allowed" }],
      });
    }
  }
  next();
};

/* ---------- CORS ----------
   Production: sirf CLIENT_ORIGINS (comma-separated env) + Vercel site.
   Dev: koi bhi localhost port aur ghar ke Wi-Fi (LAN) wale address bhi —
   taaki phone se 192.168.x.x pe test ho sake. */
const DEFAULT_ORIGINS = ["https://mdn-my-daily-nutrition.vercel.app"];
const DEV_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/;

const allowedOrigins = () => [
  ...DEFAULT_ORIGINS,
  ...(process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];

const corsOptions = {
  origin: (origin, callback) => {
    // Bina Origin wali requests (server-to-server, Razorpay webhook, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins().includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== "production" && DEV_ORIGIN.test(origin)) return callback(null, true);
    // 403 — pehle yeh 500 ban jata tha
    callback(Object.assign(new Error("Origin not allowed by CORS"), { status: 403 }));
  },
  credentials: true,
};

/* ---------- Rate limits ----------
   Login ke baad wale routes pe user id se ginti (ek hi Wi-Fi ke kai log
   aapas me na takrayein), warna IP se. Limit cross hone par bhi wahi
   { success, message } shape. */
const keyByUserOrIp = (req) => (req.user?._id ? `user:${req.user._id}` : ipKeyGenerator(req.ip));

const limiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: keyByUserOrIp,
    handler: (req, res) => res.status(429).json({ success: false, message }),
  });

const MIN = 60 * 1000;

const limits = {
  // Google sign-in — 15 min me 20 koshish
  auth: limiter(15 * MIN, 20, "Too many sign-in attempts. Please wait a few minutes and try again."),
  // Har 15 min me access token refresh hota hai, kai tabs ho sakte hain
  refresh: limiter(15 * MIN, 60, "Too many session refreshes. Please wait a few minutes."),
  contact: limiter(60 * MIN, 5, "You've sent several messages already. Please wait an hour or reach us on WhatsApp."),
  review: limiter(60 * MIN, 10, "Too many reviews in a short time. Please try again later."),
  // Coupon codes guess karne se rokne ke liye
  coupon: limiter(15 * MIN, 15, "Too many coupon attempts. Please wait a few minutes."),
  payment: limiter(15 * MIN, 20, "Too many payment attempts. Please wait a few minutes and try again."),
  // Pincode check (India Post lookup) — form bharte waqt kuch hi baar chahiye
  pincode: limiter(1 * MIN, 30, "Too many pincode checks. Please wait a minute."),
  // OTP: ghante me 10 code, aur verify ki koshishen bhi seemit
  otpSend: limiter(60 * MIN, 10, "Too many codes requested. Please try again in an hour."),
  otpVerify: limiter(15 * MIN, 20, "Too many verification attempts. Please wait a few minutes."),
};

module.exports = { rejectMongoOperators, corsOptions, limits };
