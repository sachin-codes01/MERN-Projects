const rateLimit = require('express-rate-limit')

// ==========================================================
// RATE LIMITING - login/password endpoints
//
// Bina rate limit ke koi bhi script chupchaap hazaron password guess
// kar sakta hai. Do alag limiter hain, kyunki ek hi combined counter
// rakhne se genuine users apne-aap ko lock kar lete the:
//
//   authLimiter    -> asli auth badalne wale kaam (login, register,
//                      google, password set/reset). Sakht rakha hai -
//                      yahan brute-force hi asli khatra hai
//   lookupLimiter  -> sirf padhne wale check (check-email, verify-otp).
//                      Signup aur "forgot password" dono ke multi-step
//                      flow me ye 2-3 baar chalte hain (email check,
//                      OTP bharna, phir asli register/reset) - ek hi
//                      15-minute window me kai baar retry karna (galat
//                      password, galat code type ho jana) aam baat hai,
//                      isliye zyada dheela rakha hai
//   otpLimiter     -> email BHEJNE wala route. Sabse sakht, kyunki har
//                      request par ek asli email jata hai: SMTP account
//                      ki roz ki limit (Gmail par ~500/din) bhi hai aur
//                      kisi ki inbox bhar dena bhi apne aap me abuse hai.
//                      Per-email 60 second cooldown routes/auth.js me
//                      alag se hai - ye limiter per-IP hai
//
// standardHeaders: RateLimit-* headers bhej dete hain (kitne bache hain)
// legacyHeaders: purane X-RateLimit-* headers band, ek hi tarika kaafi hai
// ==========================================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
})

const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
})

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification emails requested. Please try again later.' },
})

module.exports = { authLimiter, lookupLimiter, otpLimiter }
