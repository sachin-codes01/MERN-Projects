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
const createToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })

// Frontend ko bhejne se pehle user ka safe version banate hain
// Yahan se aage chalkar koi private field nikalna ho to ek hi jagah change karna padega
const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profileImage: user.profileImage,
  isOnline: user.isOnline,
  lastSeen: user.lastSeen,
  createdAt: user.createdAt,
})

module.exports = { COOKIE_NAME, cookieOptions, createToken, publicUser }
