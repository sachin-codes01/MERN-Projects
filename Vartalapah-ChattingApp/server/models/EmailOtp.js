const mongoose = require('mongoose')

// ==========================================================
// EMAIL OTP MODEL
//
// Signup aur "forgot password" me email par 6-digit code bhejte hain -
// wahi code yahan (hash karke) rakha jata hai jab tak user use bhar
// nahi deta
//
// Ek email ke liye ek purpose ka SIRF EK hi live code hota hai
// (unique index niche) - naya code maangne par purana upsert se
// overwrite ho jata hai, yaani purana turant bekaar ho jata hai
// ==========================================================
const emailOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },

  // register = naya account banate waqt email verify
  // reset    = password bhool jane par pehchaan
  //
  // Dono alag rakhe hain taaki signup ke liye bheja gaya code password
  // reset karne me na chal jaye (aur ulta bhi nahi)
  purpose: { type: String, required: true, enum: ['register', 'reset'] },

  // Plain code KABHI save nahi hota - password ki tarah hi ise bhi
  // hash karke rakhte hain (utils/otp.js)
  codeHash: { type: String, required: true },

  // Is waqt ke baad code bekaar
  expiresAt: { type: Date, required: true },

  // Kitni baar galat code dala - limit paar hote hi code cancel
  // (warna 6 digits sirf 10 lakh combinations hain, script easily guess kar leti)
  attempts: { type: Number, default: 0 },

  // Aakhri baar mail kab bheja - "Resend" ka cooldown isi se nikalta hai
  lastSentAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
})

// Ek email + purpose ka ek hi document - isi wajah se upsert kaam karta hai
emailOtpSchema.index({ email: 1, purpose: 1 }, { unique: true })

// TTL index - expiry ke baad MongoDB khud document uda deta hai, hume
// safai ka koi cron nahi likhna padta
//
// DHYAN: TTL ka background monitor har ~60 second me chalta hai, yaani
// expire hua document thodi der zinda reh sakta hai. Isliye code me bhi
// expiresAt hamesha khud check karte hain (routes/auth.js) - sirf is
// index par bharosa nahi karte
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('EmailOtp', emailOtpSchema)
