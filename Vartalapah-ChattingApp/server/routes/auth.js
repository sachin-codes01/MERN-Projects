const express = require('express')
const bcrypt = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')
const { User } = require('../models')
const { protect } = require('../middleware/protect')
const { authLimiter, lookupLimiter } = require('../middleware/rateLimit')
const { issueCsrfCookie, clearCsrfCookie, verifyCsrf } = require('../middleware/csrf')
const { validatePassword, PASSWORD_REQUIREMENTS_MESSAGE } = require('../utils/validatePassword')
const { COOKIE_NAME, cookieOptions, cookieOptionsFor, createToken, publicUser } = require('../utils/token')

// bcrypt jitna zyada "cost", hash utna hi dheere banta hai - jaan
// boojhkar dheera rakha jata hai taaki koi ek second me lakhon
// passwords guess na kar sake. 10 aajkal ka standard middle-ground hai
const BCRYPT_SALT_ROUNDS = 10

// Login form se email hamesha isi tarah saaf karke bhejte hain -
// database me bhi email lowercase+trimmed hi save hoti hai (User.js dekho)
const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Username: 3-20 akshar, sirf letters/numbers/underscore/dot - schema
// (models/User.js) me bhi yahi niyam hai, dono jagah sync rehna chahiye
const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,20}$/

// ==========================================================
// AUTH ROUTES - /api/auth/...
//
// Login, apni profile padhna/badalna, account delete, logout
//
// Cookie ka naam aur JWT banane ka kaam utils/token.js me hai,
// aur token check karne wala middleware middleware/protect.js me -
// kyunki wo dono socket ko bhi chahiye hote hain
// ==========================================================
const router = express.Router()

// Google ka client - isse hum Google se aaye token ko verify karte hain
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// Google credential (ID token) verify karna do jagah chahiye - normal
// Google login (/google) aur "forgot password" wala Google-se-pehchaan
// (/reset-password). Dono me galat/expire/nakli token par wahi ek jaisa
// safe error dikhna chahiye, isliye ek hi jagah rakha hai
const verifyGoogleCredential = async (credential) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()

    // Google khud bataata hai ki email verified hai ya nahi - agar
    // Google ne khud verify nahi ki, to hum bhi usse "email ki malikiyat
    // ka saboot" maankar aage nahi badh sakte (login, signup, password
    // reset - teeno isi email par bharosa karte hain)
    if (payload?.email_verified === false) {
      console.error('Google token verify fail: email not verified by Google')
      return null
    }

    return payload
  } catch (verifyError) {
    // Token nakli, expire ya kisi aur app ka hai
    // Google ka andar wala error message bahar nahi bhejte (security)
    console.error('Google token verify fail:', verifyError.message)
    return null
  }
}

// ==========================================================
// POST /api/auth/google
// Frontend Google se token laata hai, hum use verify karke apna JWT dete hain
// ==========================================================
router.post('/google', authLimiter, async (req, res, next) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google token missing' })
    }

    // Frontend par bharosa nahi karte - verification hamesha backend par hoti hai
    const payload = await verifyGoogleCredential(credential)
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Google login failed, please try again' })
    }

    // Google se user ki verified information milti hai
    const { sub: googleId, email, name, picture } = payload

    // Google ne email verify nahi kiya to aage nahi badhte
    if (!email) {
      return res.status(400).json({ success: false, message: 'No email received from Google account' })
    }

    // Database me is email ka user pehle se hai kya?
    // isDeleted wale ko chhod dete hain - taki delete karne ke baad dobara login
    // karne par bilkul naya khali account bane, purani chats ke bina
    //
    // +password: password field select:false hai, lekin publicUser() ise
    // dekhkar hi "needsPassword" decide karta hai - isliye yahan mangwana
    // zaroori hai, warna har existing user bhi "password banao" wali
    // screen par bhej diya jayega
    let user = await User.findOne({ email, isDeleted: { $ne: true } }).select('+password')

    if (!user) {
      // Naya user hai -> account bana do (yahi "register" hai)
      user = await User.create({
        name,
        email,
        profileImage: picture || '',
        googleId,
        isOnline: true,
      })
    } else {
      // Purana user hai -> bas online mark kar do
      if (!user.googleId) user.googleId = googleId
      if (!user.profileImage) user.profileImage = picture || ''
      user.isOnline = true
      await user.save()
    }

    // JWT ko httpOnly cookie me bhej dete hain
    res.cookie(COOKIE_NAME, createToken(user._id), cookieOptions)
    issueCsrfCookie(res)

    res.json({ success: true, user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// POST /api/auth/set-password
// Google se pehli baar aaya user apna "application password" banata hai -
// iske baad wo Google ke bina, seedha email+password se bhi login kar sakta hai
//
// protect middleware laga hai (cookie chahiye) - yaani ye tabhi chalta hai
// jab user Google se already ek baar login kar chuka ho. Naya password
// koi bhi random visitor nahi bana sakta, sirf wahi jiski cookie ho
// ==========================================================
router.post('/set-password', authLimiter, verifyCsrf, protect, async (req, res, next) => {
  try {
    // Ek baar password ban jaye to yahi route dobara se use nahi badal
    // sakta (koi purana password check nahi hai yahan) - "change password"
    // ek alag, purana password maangne wala flow hoga, ye sirf pehli baar ke liye hai
    if (req.user.password) {
      return res.status(400).json({
        success: false,
        message: 'A password is already set for this account',
      })
    }

    const { password, confirmPassword } = req.body

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and confirmation are required' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, message: PASSWORD_REQUIREMENTS_MESSAGE })
    }

    req.user.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
    await req.user.save()

    res.json({ success: true, user: publicUser(req.user) })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// POST /api/auth/check-email
// ForgotPassword.jsx ka STEP 1 - user pehle apna email bharta hai.
// Isi email se check karte hain ki account hai bhi ya nahi.
//
// DHYAN: account Google se bana ho ya seedha username+password se
// signup kiya ho - dono ke liye reset chalta hai. Google se USI EMAIL
// ko dobara verify karna khud ek sabooot hai ki wo email tumhara hi hai -
// account kaise bana tha, uska koi lena dena nahi (routes ka /reset-password
// bhi email se hi match karta hai, googleId se nahi)
// ==========================================================
router.post('/check-email', lookupLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' })
    }

    const user = await User.exists({ email, isDeleted: { $ne: true } })

    res.json({ success: true, exists: !!user })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// POST /api/auth/google-check
// ForgotPassword.jsx ke STEP 2 me Google se verify hote hi (credential
// mil chuka) isse pooch leta hai "kya is email ka koi account YAHAN
// hai?" - isliye ki agar banda galti se apna DOOSRA Google account
// chun le (jiska is app me account hi nahi hai, ya Step 1 wali email
// se nahi milta), to use turant pata chal jaye, naya password bharne
// se pehle - warna reset submit karte waqt hi pata chalta
//
// Ye sirf ek boolean batata hai (exists: true/false) - password ya
// koi aur private field kabhi nahi
// ==========================================================
router.post('/google-check', lookupLimiter, async (req, res, next) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google verification is required' })
    }

    const payload = await verifyGoogleCredential(credential)
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Google verification failed, please try again' })
    }

    if (!payload.email) {
      return res.status(400).json({ success: false, message: 'No email received from Google account' })
    }

    const exists = await User.exists({ email: payload.email, isDeleted: { $ne: true } })

    res.json({ success: true, email: payload.email, exists: !!exists })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// POST /api/auth/reset-password
// "Forgot password" - koi email/SMS bhejne wala service iss app me
// nahi hai, isliye pehchaan Google se hi karwate hain (jaisa Google
// login karte waqt hota hai). Fresh Google credential ka matlab hai
// "ye SACH ME wahi banda hai jiske paas is email ka Google account hai" -
// isse zyada bharosemand koi doosra tarika bina email/SMS ke nahi hai
//
// protect middleware yahan JAAN-BOOJHKAR nahi laga - banda apne purane
// device/session ke bina bhi (jahan cookie kho gayi ho) password reset
// kar sake, isiliye Google credential hi pehchaan hai, cookie nahi
// ==========================================================
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { credential, password, confirmPassword } = req.body

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google verification is required' })
    }

    const payload = await verifyGoogleCredential(credential)
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Google verification failed, please try again' })
    }

    if (!payload.email) {
      return res.status(400).json({ success: false, message: 'No email received from Google account' })
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and confirmation are required' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, message: PASSWORD_REQUIREMENTS_MESSAGE })
    }

    const user = await User.findOne({ email: payload.email, isDeleted: { $ne: true } })

    // Is email se koi account hi nahi hai - "sign up" pehle Google se karo
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found for this Google email. Sign in with Google first to create one.',
      })
    }

    user.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
    await user.save()

    // Yahan JAAN-BOOJHKAR cookie set nahi karte / login nahi karate -
    // user ko wapas login page par bhejte hain, taaki wo apne naye
    // password se khud login kare (Google Sign-In wala button us login
    // page par bilkul alag, normal jagah hai - is reset flow se uska
    // koi lena dena nahi)
    res.json({ success: true, message: 'Password updated. Please log in with your new password.' })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// POST /api/auth/register
// Naya account - username + email + password se signup.
//
// Email ki malikiyat isi tarah pakki karte hain jaise "forgot password"
// me karte hain (dekho /reset-password upar) - koi email/SMS bhejne
// wala service nahi hai, isliye Google se ek baar verify karwate hain
// ki jo email form me likhi hai wahi banda SACH ME chalata hai. Isके
// bina koi bhi kisi aur ka email daalkar uske naam ka account bana sakta tha
//
// Verify hote hi googleId bhi save kar dete hain - taaki aage se ye
// account "Continue with Google" se bhi khul sake, sirf password se hi nahi
// ==========================================================
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim()
    const email = normalizeEmail(req.body.email)
    const { password, confirmPassword, credential } = req.body

    if (!username || !USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-20 characters (letters, numbers, underscore or dot only)',
      })
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' })
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and confirmation are required' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, message: PASSWORD_REQUIREMENTS_MESSAGE })
    }

    // ---- EMAIL VERIFY (Google) ----
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Please verify your email with Google before creating an account' })
    }

    const payload = await verifyGoogleCredential(credential)
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Google verification failed, please try again' })
    }

    const googleEmail = normalizeEmail(payload.email)
    if (!googleEmail) {
      return res.status(400).json({ success: false, message: 'No email received from Google account' })
    }

    // Jo email form me likhi thi wahi Google se verify honi chahiye -
    // warna koi apni email likhkar kisi AUR ke Google account se verify
    // karwa sakta tha
    if (googleEmail !== email) {
      return res.status(400).json({
        success: false,
        message: `That Google account is ${googleEmail}, but you entered ${email}. Please verify with the matching Google account.`,
      })
    }

    // Username unique nahi hai (schema me bhi nahi) - sirf email se check
    const emailTaken = await User.exists({ email, isDeleted: { $ne: true } })

    if (emailTaken) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)

    // "name" poori app me har jagah dikhta hai (header, sidebar, search) -
    // username se hi shuru karte hain, baad me Profile se badal sakta hai
    const user = await User.create({
      name: username,
      username,
      email,
      password: hashedPassword,
      googleId: payload.sub,
      profileImage: payload.picture || '',
      isOnline: true,
    })

    res.cookie(COOKIE_NAME, createToken(user._id), cookieOptions)
    issueCsrfCookie(res)

    res.status(201).json({ success: true, user: publicUser(user) })
  } catch (err) {
    // Race condition: do requests ek hi second me same email bhej dein to
    // upar wala exists() check dono ko "free" dikha sakta hai - database
    // ka unique index (email par) hi aakhri sach hai (E11000)
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' })
    }
    next(err)
  }
})

// ==========================================================
// POST /api/auth/login
// Email + password se login - isse Google account ke bina bhi wahi
// account dobara khul jata hai (jis banda ne pehle Create Password
// screen se password bana rakha hai)
// ==========================================================
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)
    const { password, rememberMe } = req.body

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' })
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' })
    }

    // +password: default query me ye field aata hi nahi
    const user = await User.findOne({ email, isDeleted: { $ne: true } }).select('+password')

    // User na mile - generic message (specific "email not found" batane se
    // attacker ko pata chal jata hai ki kaun kaun sa email registered hai)
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    // Google se bana account hai lekin password kabhi banaya hi nahi -
    // yahan bcrypt.compare karne ka koi matlab nahi (compare against null crash karega)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google sign-in and has not set a password yet. Continue with Google to set one.',
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    user.isOnline = true
    await user.save()

    // Remember me -> 30 din wali cookie/token, warna wahi default 7 din
    const maxAgeMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : cookieOptions.maxAge
    const expiresIn = rememberMe ? '30d' : '7d'

    res.cookie(COOKIE_NAME, createToken(user._id, expiresIn), cookieOptionsFor(maxAgeMs))
    // CSRF cookie bhi wahi maxAge - warna "remember me" wali lambi session
    // ke beech me hi CSRF cookie khatam ho jati aur mutating actions
    // achanak "Invalid CSRF token" dene lagte
    issueCsrfCookie(res, cookieOptionsFor(maxAgeMs))

    res.json({ success: true, user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// GET /api/auth/me
// Page refresh hone par frontend ye call karta hai
// Cookie already browser me hai, isse pata chalta hai ki user logged in hai ya nahi
//
// Cookie hai HI NAHI to ye galti nahi hai - banda bas logged out hai.
// Isliye yahan 401 nahi bhejte, 200 ke saath user: null bhejte hain.
// Wajah: browser har failed request ko console me laal karke dikhata hai
// (JS use chhupa nahi sakta), aur bina login wale HAR visitor ko landing
// page kholte hi "401 Unauthorized" dikh raha tha - jabki app bilkul
// theek chal raha tha.
//
// Cookie mojood ho lekin galat/expire ho to protect hi sambhalta hai
// aur wahan 401 hi sahi jawab hai - wo behaviour waisa ka waisa hai
// ==========================================================
const skipIfLoggedOut = (req, res, next) => {
  if (!req.cookies[COOKIE_NAME]) return res.json({ success: true, user: null })
  next()
}

router.get('/me', skipIfLoggedOut, protect, (req, res) => {
  res.json({ success: true, user: publicUser(req.user) })
})

// ==========================================================
// PUT /api/auth/me
// Apna naam aur profile photo update karna
// ==========================================================
router.put('/me', verifyCsrf, protect, async (req, res, next) => {
  try {
    const { name, profileImage } = req.body

    // Validation - frontend par bharosa nahi karte, backend par dobara check karte hain
    if (name !== undefined) {
      const cleanName = String(name).trim()
      if (cleanName.length < 2 || cleanName.length > 40) {
        return res.status(400).json({ success: false, message: 'Name must be between 2 and 40 characters' })
      }
      req.user.name = cleanName
    }

    // profileImage sirf Cloudinary ka URL hoga (Step 6 me)
    if (profileImage !== undefined) {
      req.user.profileImage = String(profileImage)
    }

    await req.user.save()
    res.json({ success: true, user: publicUser(req.user) })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// DELETE /api/auth/me
// Apna account delete karna
//
// Hum document MITATE nahi hain, sirf isDeleted: true kar dete hain ("soft delete")
// Kyun? Kyunki purane messages me sender ki id padi hai. User ko mita denge to
// saamne wale ki chat toot jayegi - aur user ne kaha tha ki uski chat rehni chahiye
//
// Email badal dete hain taki wahi Google account dobara login kare to
// bilkul naya khali account bane, purani chats ke bina
// ==========================================================
router.delete('/me', verifyCsrf, protect, async (req, res, next) => {
  try {
    const user = req.user

    // Email par unique index laga hai, isliye purani email ko "free" karna padega
    user.email = `deleted_${user._id}_${user.email}`
    user.googleId = ''
    user.name = 'Deleted User'
    user.profileImage = ''
    user.profileImageId = ''
    user.isOnline = false
    user.isDeleted = true
    user.deletedAt = new Date()

    // Apni chat list ki settings ka ab koi matlab nahi
    user.blockedUsers = []
    user.pinnedChats = []
    user.archivedChats = []
    user.hiddenChats = []

    await user.save()

    // Cookie hata do - turant logout
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined })
    clearCsrfCookie(res)

    res.json({ success: true, message: 'Your account has been deleted' })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// POST /api/auth/logout
// Cookie hata dete hain aur user ko offline mark karte hain
// ==========================================================
router.post('/logout', verifyCsrf, protect, async (req, res, next) => {
  try {
    req.user.isOnline = false
    req.user.lastSeen = new Date()
    await req.user.save()

    // Browser se cookie hata do
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined })
    clearCsrfCookie(res)

    res.json({ success: true, message: 'Logged out' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
