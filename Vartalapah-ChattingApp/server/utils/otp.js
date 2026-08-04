const crypto = require('crypto')
const jwt = require('jsonwebtoken')

// ==========================================================
// OTP HELPERS
//
// Do cheezein yahan hain:
//   1. 6-digit code banana / hash karna / milana
//   2. "email verify ho chuki hai" wala short-lived token banana
//
// Token ki zarurat kyun? Kyunki OTP verify karna aur asli kaam
// (register / reset-password) do alag requests hain. Verify hote hi
// hum ek signed token dete hain jiska matlab hai "is email ki
// malikiyat abhi abhi saabit ho chuki hai" - agli request wahi token
// bhejti hai. Pehle yahi kaam Google ka credential karta tha
// ==========================================================

// 6 digits: yaad rakhne/type karne me aasan, aur attempts+expiry ki
// wajah se guess karna practically namumkin
const OTP_LENGTH = 6

// Itni der code valid rehta hai
const OTP_TTL_MINUTES = 10
const OTP_TTL_MS = OTP_TTL_MINUTES * 60 * 1000

// Dobara mail maangne se pehle itna rukna padega (spam se bachav)
const OTP_RESEND_COOLDOWN_SECONDS = 60
const OTP_RESEND_COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000

// Itni galat koshishon ke baad code cancel - phir naya mangwana padega
const OTP_MAX_ATTEMPTS = 5

// Verify hone ke baad mila token itni der chalta hai - itna time
// naya password type karne ke liye kaafi hai
const VERIFICATION_TOKEN_TTL = '15m'

// JWT_SECRET poore app me ek hi hai (login cookie bhi wahi use karti
// hai), isliye token ke andar "typ" likhte hain - taaki koi login wala
// token yahan aur ye token login me na chal jaye
const VERIFICATION_TOKEN_TYPE = 'email_verify'

// crypto.randomInt cryptographically secure hai - Math.random() se
// bana code guess kiya ja sakta hai (uska sequence predictable hota hai)
const generateOtp = () =>
  String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0')

// Code plain save nahi karte. Sirf sha256 bhi kaafi nahi hota - 6 digits
// ke sirf 10 lakh combinations hain, database leak hone par koi bhi
// saari hashes ek second me bana sakta hai. Isliye HMAC use karte hain:
// bina JWT_SECRET jaane hash banaya hi nahi ja sakta
const hashOtp = (code) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET).update(String(code)).digest('hex')

// Dono hashes barabar hain ya nahi - normal === ki jagah timingSafeEqual,
// taaki jawab dene me lage time se koi hash "guess" na kar sake
const matchOtp = (code, codeHash) => {
  const candidate = Buffer.from(hashOtp(code))
  const expected = Buffer.from(String(codeHash))

  if (candidate.length !== expected.length) return false

  return crypto.timingSafeEqual(candidate, expected)
}

// Email verify hone ka saboot - isme koi secret nahi hai, sirf ye ki
// kaun si email kis kaam ke liye verify hui hai
const createVerificationToken = (email, purpose) =>
  jwt.sign(
    { email, purpose, typ: VERIFICATION_TOKEN_TYPE },
    process.env.JWT_SECRET,
    { expiresIn: VERIFICATION_TOKEN_TTL },
  )

// Token sahi hai to email wapas, warna null. Purpose bhi match hona
// chahiye - signup ka token password reset me nahi chalega
const readVerificationToken = (token, purpose) => {
  try {
    const payload = jwt.verify(String(token || ''), process.env.JWT_SECRET)

    if (payload.typ !== VERIFICATION_TOKEN_TYPE) return null
    if (payload.purpose !== purpose) return null
    if (!payload.email) return null

    return String(payload.email).toLowerCase()
  } catch {
    // Expire / nakli / chhed-chhad kiya hua token
    return null
  }
}

module.exports = {
  OTP_LENGTH,
  OTP_TTL_MINUTES,
  OTP_TTL_MS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
  generateOtp,
  hashOtp,
  matchOtp,
  createVerificationToken,
  readVerificationToken,
}
