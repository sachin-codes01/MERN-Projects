const express = require('express')
const bcrypt = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')
const { User, EmailOtp } = require('../models')
const { protect } = require('../middleware/protect')
const { authLimiter, lookupLimiter, otpLimiter } = require('../middleware/rateLimit')
const { issueCsrfCookie, clearCsrfCookie, verifyCsrf } = require('../middleware/csrf')
const { validatePassword, PASSWORD_REQUIREMENTS_MESSAGE } = require('../utils/validatePassword')
const { COOKIE_NAME, cookieOptions, cookieOptionsFor, createToken, publicUser } = require('../utils/token')
const { sendOtpEmail, isFastTransport } = require('../utils/mailer')
const {
  OTP_TTL_MINUTES, OTP_TTL_MS, OTP_RESEND_COOLDOWN_MS, OTP_RESEND_COOLDOWN_SECONDS, OTP_MAX_ATTEMPTS,
  generateOtp, hashOtp, matchOtp, createVerificationToken, readVerificationToken,
} = require('../utils/otp')

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

// Google credential (ID token) verify karna - ab sirf ek hi jagah
// chahiye: one-click "Continue with Google" login (/google)
//
// Pehle signup aur "forgot password" bhi email ki malikiyat isi se
// saabit karwate the. Ab wo dono email par bheje gaye OTP se hoti hai
// (/send-otp + /verify-otp) - yaani jiske paas Google account nahi hai
// wo bhi normal signup kar sakta hai aur password reset kar sakta hai
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

// Email par code bhejne ki do hi wajah ho sakti hai. Koi teesri
// value bheji to seedha reject - warna aage ka saara logic
// ("account hona chahiye" / "nahi hona chahiye") bekaar ho jata
const OTP_PURPOSES = ['register', 'reset']

// Mail nikalne ka zyada se zyada itna intezaar karte hain. Iske baad
// user ko "bhej diya" bolkar chhod dete hain aur mail background me
// jata rehta hai
//
// Kyun? Gmail ka SMTP handshake kabhi kabhi 10-20 second le leta hai
// (ISP, TLS, antivirus scan). Utni der screen par sirf "Sending
// code..." dikhta rehta hai - jabki code to database me pehle hi save
// ho chuka hota hai aur mail bhi nikal hi jata hai, bas dheere
//
// 3 second itna hai ki normal (warm connection wala) send poora ho
// jaye - yaani asli SMTP error abhi bhi user tak turant pahunchta hai
//
// LEKIN ye chhota intezaar sirf SMTP ki majboori hai, aur iski keemat
// hai: mail 3 second ke BAAD fail ho to user ko "code bhej diya" wali
// screen dikh chuki hoti hai jabki koi mail aaya hi nahi (deployed
// site par yahi ho raha tha - Render free plan SMTP block karta hai)
//
// Brevo API wale raste me send ~1 second ka hai, isliye wahan poora
// intezaar karte hain aur user ko hamesha sach batate hain. 10 second
// ki chhat sirf isliye ki API hi latak jaye to request phansi na rahe
const MAIL_WAIT_MS = isFastTransport ? 10000 : 3000

// ==========================================================
// POST /api/auth/send-otp
// Email par 6-digit code bhejta hai. Signup (purpose: 'register')
// aur "forgot password" (purpose: 'reset') - dono yahi use karte hain
//
// Purpose se ye bhi tay hota hai ki account HONA chahiye ya NAHI:
//   register -> email free honi chahiye (warna wahi account do baar)
//   reset    -> account hona hi chahiye (nahi hai to reset kis cheez ka)
//
// Isse user ko galti ka pata abhi chal jata hai - code type karne aur
// password bharne ke BAAD nahi
// ==========================================================
router.post('/send-otp', otpLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)
    const purpose = String(req.body.purpose || '')

    if (!OTP_PURPOSES.includes(purpose)) {
      return res.status(400).json({ success: false, message: 'Invalid verification request' })
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' })
    }

    const accountExists = await User.exists({ email, isDeleted: { $ne: true } })

    if (purpose === 'register' && accountExists) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' })
    }

    if (purpose === 'reset' && !accountExists) {
      return res.status(404).json({ success: false, message: 'No account found for this email address' })
    }

    // ---- RESEND COOLDOWN ----
    // Rate limiter (otpLimiter) IP se ginta hai. Ye cooldown EMAIL se
    // ginta hai - warna alag alag IP/proxy se koi bhi kisi ki inbox
    // seconds me bhar sakta tha
    const existing = await EmailOtp.findOne({ email, purpose })

    if (existing) {
      const waitMs = OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt.getTime())

      if (waitMs > 0) {
        const waitSeconds = Math.ceil(waitMs / 1000)
        return res.status(429).json({
          success: false,
          retryAfter: waitSeconds,
          message: `Please wait ${waitSeconds}s before requesting another code`,
        })
      }
    }

    const code = generateOtp()

    // upsert: is email+purpose ka purana code (agar hai to) yahi overwrite
    // ho jata hai - yaani purana turant bekaar. Ek waqt par ek hi code zinda
    //
    // attempts wapas 0 - naya code, nayi 5 koshishein
    await EmailOtp.findOneAndUpdate(
      { email, purpose },
      {
        email,
        purpose,
        codeHash: hashOtp(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        attempts: 0,
        lastSentAt: new Date(),
      },
      { upsert: true, setDefaultsOnInsert: true },
    )

    // Mail bhejna shuru karte hain, lekin iska poora intezaar nahi karte
    // (upar MAIL_WAIT_MS wala comment dekho)
    //
    // Ye promise KABHI reject nahi hota - error andar hi pakad kar
    // mailFailure me rakh lete hain. Warna race jeetne ke baad koi
    // reject hoti promise bina handler ke reh jati (unhandled rejection)
    let mailFailure = null

    const mailTask = sendOtpEmail({ to: email, code, purpose, minutes: OTP_TTL_MINUTES })
      .catch(async (mailError) => {
        mailFailure = mailError
        console.error('OTP mail bhejne me dikkat:', mailError.message)

        // Mail gaya hi nahi to database me code chhodne ka koi fayda
        // nahi - user ko wo kabhi milega hi nahi, aur wo pada rehkar
        // agle "Resend" ko 60 second ke cooldown me atka dega
        await EmailOtp.deleteOne({ email, purpose }).catch(() => {})
      })

    // Jo pehle ho jaye: ya to mail nikal jaye, ya 3 second poore ho jayein
    await Promise.race([
      mailTask,
      new Promise((resolve) => setTimeout(resolve, MAIL_WAIT_MS)),
    ])

    // Turant fail hua (galat password, SMTP band) - user ko sach batate hain
    if (mailFailure) {
      return res.status(502).json({
        success: false,
        message: 'Could not send the verification email. Please try again in a moment.',
      })
    }

    res.json({
      success: true,
      message: `Verification code sent to ${email}`,
      expiresInMinutes: OTP_TTL_MINUTES,
      resendAfter: OTP_RESEND_COOLDOWN_SECONDS,
    })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// POST /api/auth/verify-otp
// User ne jo code bhara wo sahi hai ya nahi
//
// Sahi nikla to ek chhota "verification token" milta hai (15 min).
// Uska matlab sirf itna: "is email ki malikiyat abhi abhi saabit ho
// chuki hai". Wahi token aage /register ya /reset-password ko jata hai
//
// Alag request kyun? Kyunki code verify karne aur asli kaam (account
// banana / password badalna) ke beech me user password type kar raha
// hota hai. Token hi wo "parchi" hai jo beech ka rasta jodti hai -
// bilkul wahi kaam jo pehle Google ka credential karta tha
// ==========================================================
router.post('/verify-otp', lookupLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)
    const purpose = String(req.body.purpose || '')
    const code = String(req.body.code || '').trim()

    if (!OTP_PURPOSES.includes(purpose)) {
      return res.status(400).json({ success: false, message: 'Invalid verification request' })
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' })
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: 'Enter the 6-digit code from your email' })
    }

    const record = await EmailOtp.findOne({ email, purpose })

    // TTL index se document apne aap hatta to hai, lekin MongoDB ka wo
    // background monitor har ~60 second me chalta hai - beech me expire
    // hua code abhi bhi mil sakta hai. Isliye expiry khud bhi check karte hain
    const isExpired = record && record.expiresAt.getTime() < Date.now()

    if (!record || isExpired) {
      if (record) await EmailOtp.deleteOne({ _id: record._id })

      return res.status(400).json({
        success: false,
        message: 'This code has expired. Please request a new one.',
      })
    }

    if (!matchOtp(code, record.codeHash)) {
      record.attempts += 1
      const attemptsLeft = OTP_MAX_ATTEMPTS - record.attempts

      // Limit paar - code hi mita dete hain. 6 digits sirf 10 lakh
      // combinations hain, bina is limit ke script baithe baithe guess kar leti
      if (attemptsLeft <= 0) {
        await EmailOtp.deleteOne({ _id: record._id })

        return res.status(400).json({
          success: false,
          message: 'Too many incorrect attempts. Please request a new code.',
        })
      }

      await record.save()

      return res.status(400).json({
        success: false,
        message: `Incorrect code. ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} left.`,
      })
    }

    // Sahi code - ek hi baar chalta hai. Turant mita dete hain taaki
    // wahi code dobara use na ho sake
    await EmailOtp.deleteOne({ _id: record._id })

    res.json({
      success: true,
      email,
      verificationToken: createVerificationToken(email, purpose),
    })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// POST /api/auth/reset-password
// "Forgot password" - pehchaan email par bheje gaye OTP se hoti hai
// (/send-otp -> /verify-otp -> yahan). Verification token ka matlab
// hai "is banda ne abhi abhi is email ke inbox tak apni pahunch saabit
// ki hai" - password bhool jane par yahi sabse seedha saboot hai
//
// protect middleware yahan JAAN-BOOJHKAR nahi laga - banda apne purane
// device/session ke bina bhi (jahan cookie kho gayi ho) password reset
// kar sake, isiliye email verification hi pehchaan hai, cookie nahi
// ==========================================================
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { verificationToken, password, confirmPassword } = req.body

    if (!verificationToken) {
      return res.status(400).json({ success: false, message: 'Email verification is required' })
    }

    // Token expire ho gaya / chhed-chhad hui / signup wala token yahan
    // bhej diya - teeno me email null hi aata hai
    const verifiedEmail = readVerificationToken(verificationToken, 'reset')

    if (!verifiedEmail) {
      return res.status(401).json({
        success: false,
        message: 'Your verification has expired. Please verify your email again.',
      })
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

    const user = await User.findOne({ email: verifiedEmail, isDeleted: { $ne: true } })

    // /send-otp pehle hi check kar chuka hai ki account hai - lekin beech
    // ke 15 minute me account delete bhi ho sakta hai, isliye dobara check
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found for this email address. Please create one first.',
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
// me karte hain (dekho /reset-password upar) - form me likhi email par
// 6-digit code bhejte hain aur wahi code wapas maangte hain. Iske bina
// koi bhi kisi aur ka email daalkar uske naam ka account bana sakta tha
//
// Yahan googleId save NAHI hota (Google is flow me hai hi nahi) - lekin
// user baad me "Continue with Google" bhi kar sakta hai: /google email
// se hi account dhundhta hai aur pehli baar me googleId khud jod deta hai
// ==========================================================
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim()
    const email = normalizeEmail(req.body.email)
    const { password, confirmPassword, verificationToken } = req.body

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

    // ---- EMAIL VERIFY (OTP) ----
    if (!verificationToken) {
      return res.status(400).json({ success: false, message: 'Please verify your email before creating an account' })
    }

    const verifiedEmail = readVerificationToken(verificationToken, 'register')

    if (!verifiedEmail) {
      return res.status(401).json({
        success: false,
        message: 'Your verification has expired. Please verify your email again.',
      })
    }

    // Jo email verify hui thi, account bhi USI ka banna chahiye. Token me
    // email likhi hui hai isliye ye hamesha match karegi - lekin frontend
    // ne beech me email badal di ho (user ne "Change details" dabaya) to
    // yahi check use pakadta hai
    if (verifiedEmail !== email) {
      return res.status(400).json({
        success: false,
        message: `You verified ${verifiedEmail}, but the form says ${email}. Please verify the email you want to use.`,
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
