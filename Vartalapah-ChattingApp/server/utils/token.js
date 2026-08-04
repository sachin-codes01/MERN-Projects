const jwt = require('jsonwebtoken')

// ==========================================================
// JWT + COOKIE HELPERS
//
// Ye teen cheezein teen alag jagah chahiye hoti hain:
//   routes/auth.js       -> login par cookie set karta hai
//   middleware/protect.js -> har request par cookie padhta hai
//   socket/index.js      -> socket connect par wahi cookie padhta hai
//
// Isliye cookie ka naam aur settings yahan EK jagah rakhi hain.
// Pehle ye teeno jagah alag alag likhi thi - ek badalte to baaki
// do bhoolne ka pura chance tha
// ==========================================================

// Cookie ka naam - browser me isi naam se token save hoga
const COOKIE_NAME = 'instachats_token'

// Production me frontend (Vercel) aur backend (Render) alag domain par hote hain,
// isliye cookie ki settings dono jagah alag chahiye
const isProduction = process.env.NODE_ENV === 'production'

// Cookie ki settings
const cookieOptions = {
  // httpOnly: true -> JavaScript se ye cookie padhi NAHI ja sakti
  // Isse XSS attack me token chori nahi ho sakta (localStorage se zyada safe)
  httpOnly: true,

  // secure: true sirf HTTPS par cookie bhejta hai. Localhost par HTTP hai isliye development me false
  secure: isProduction,

  // Localhost par frontend aur backend ek hi site hain, to 'lax' theek hai (CSRF se bachav).
  // Production me domain alag hai - 'lax' me browser cookie bhejta hi nahi, aur login
  // har baar fail hota hai. Isliye wahan 'none' chahiye (jo bina secure:true ke chalta nahi)
  sameSite: isProduction ? 'none' : 'lax',

  // 7 din baad cookie apne aap khatam
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

// JWT token banane ka function
// Token ke andar sirf user ki id daalte hain, koi sensitive data nahi
//
// expiresIn default 7 din hai. "Remember me" wale login (routes/auth.js)
// isse 30d bhejte hain - baaki sab jagah default hi chalta hai
const createToken = (userId, expiresIn = '7d') =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn })

// createToken ke expiresIn se cookie ki maxAge bhi match honi chahiye,
// warna cookie token se pehle hi expire ho jayegi (ya ulta, token expire
// ho chuke hoga lekin cookie abhi bhi browser me padi rahegi)
const cookieOptionsFor = (maxAgeMs = cookieOptions.maxAge) => ({
  ...cookieOptions,
  maxAge: maxAgeMs,
})

// Frontend ko bhejne se pehle user ka safe version banate hain
// Yahan se aage chalkar koi private field nikalna ho to ek hi jagah change karna padega
//
// needsPassword: password abhi tak bana hi nahi (Google se pehli baar aaya
// user). Frontend isse dekhkar seedha "Create Password" screen kholta hai
const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username || null,
  email: user.email,
  profileImage: user.profileImage,
  isOnline: user.isOnline,
  lastSeen: user.lastSeen,
  createdAt: user.createdAt,
  needsPassword: !user.password,
})

module.exports = { COOKIE_NAME, cookieOptions, cookieOptionsFor, createToken, publicUser }
