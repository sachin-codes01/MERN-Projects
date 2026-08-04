const crypto = require('crypto')
const { cookieOptions } = require('../utils/token')

// ==========================================================
// CSRF PROTECTION - "double submit cookie" tarika
//
// Humara auth token httpOnly cookie me hai, aur production me
// sameSite:'none' hai (frontend aur backend alag domain par hain,
// isliye 'lax'/'strict' chalta hi nahi - warna login hi kaam nahi karta).
// 'none' ka matlab: browser ye cookie HAR request ke saath bhej deta hai,
// chahe request kisi bhi website se aayi ho. Isse ek malicious website
// user ko trick karke (bina unhe pata chale) yahan action karwa sakti thi -
// jaise account delete, message bhejna - kyunki cookie apne aap chali jati.
//
// Ilaaj: ek DOOSRI cookie (csrf_token) - httpOnly:false, taaki hamara
// apna frontend JS ise padhkar har request ke header me bhi bhej sake.
// Server check karta hai: cookie ki value aur header ki value MILNI
// chahiye. Malicious website cookie ki value browser se auto-bhejwa
// sakti hai, lekin use PADH nahi sakti (browser ka same-origin niyam) -
// isliye sahi header kabhi nahi bana sakti. Hamara apna frontend hi
// dono jagah sahi value bhej sakta hai
// ==========================================================
const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

// GET/HEAD/OPTIONS kabhi kuch badalte nahi (safe methods) - inhe check
// karne ka koi matlab nahi
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// Login/register/Google success par ye call karo - cookieOpts wahi do
// jo asli auth cookie ke liye use ki (same maxAge, taaki dono ek saath
// expire hon - warna "remember me" wali lambi session beech me hi
// CSRF error dene lagti)
const issueCsrfCookie = (res, cookieOpts = cookieOptions) => {
  const token = crypto.randomBytes(32).toString('hex')
  res.cookie(CSRF_COOKIE_NAME, token, { ...cookieOpts, httpOnly: false })
  return token
}

// ==========================================================
// getOrIssueCsrfToken - cookie ki value WAPAS bhejta hai
//
// httpOnly:false rakhne ka poora maqsad tha ki frontend JS cookie
// khud padh le. Wo localhost par chalta hai (dono ek hi origin par
// hain), lekin PRODUCTION me nahi:
//
//   frontend -> vercel.app     backend -> onrender.com
//
// Browser cookie ko backend ke domain ke naam se save karta hai.
// Request ke saath wo apne aap chali jati hai (sameSite:'none'),
// lekin vercel.app par chal raha JS use document.cookie me DEKH hi
// nahi sakta - alag domain ki cookie hai. Isliye header khali jata
// tha aur server har non-GET request 403 kar deta tha
// ("Invalid or missing CSRF token")
//
// Hal: token ek normal GET response me bhej do. Sirf hamara apna
// frontend hi ise padh sakta hai, kyunki CORS me allowed origin
// sirf CLIENT_URL hai - kisi aur website ka JS is response ko padh
// hi nahi sakta. Yaani token abhi bhi "sirf hamare paas" hai, aur
// double-submit ka poora bharosa bana rehta hai
//
// Cookie pehle se ho to wahi lautate hain (nayi banayenge to purani
// wali dusre tab ki request tod dega)
// ==========================================================
const getOrIssueCsrfToken = (req, res) =>
  req.cookies[CSRF_COOKIE_NAME] || issueCsrfCookie(res)

const clearCsrfCookie = (res) => {
  res.clearCookie(CSRF_COOKIE_NAME, { ...cookieOptions, maxAge: undefined })
}

// Route par lagao - GET waghera ko chhod deta hai, baaki me cookie aur
// header dono barabar hone chahiye
const verifyCsrf = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next()

  const cookieToken = req.cookies[CSRF_COOKIE_NAME]
  const headerToken = req.headers[CSRF_HEADER_NAME]

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ success: false, message: 'Invalid or missing CSRF token' })
  }

  next()
}

module.exports = {
  issueCsrfCookie, getOrIssueCsrfToken, clearCsrfCookie, verifyCsrf,
  CSRF_COOKIE_NAME, CSRF_HEADER_NAME,
}
