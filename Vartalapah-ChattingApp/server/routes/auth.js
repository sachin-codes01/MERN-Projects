const express = require('express')
const { OAuth2Client } = require('google-auth-library')
const { User } = require('../models')
const { protect } = require('../middleware/protect')
const { COOKIE_NAME, cookieOptions, createToken, publicUser } = require('../utils/token')

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

// ==========================================================
// POST /api/auth/google
// Frontend Google se token laata hai, hum use verify karke apna JWT dete hain
// ==========================================================
router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google token missing' })
    }

    // Google se poochhte hain ki ye token asli hai ya nahi
    // Frontend par bharosa nahi karte - verification hamesha backend par hoti hai
    let payload
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      payload = ticket.getPayload()
    } catch (verifyError) {
      // Token nakli, expire ya kisi aur app ka hai
      // Google ka andar wala error message bahar nahi bhejte (security)
      console.error('Google token verify fail:', verifyError.message)
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
    let user = await User.findOne({ email, isDeleted: { $ne: true } })

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
router.put('/me', protect, async (req, res, next) => {
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
router.delete('/me', protect, async (req, res, next) => {
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

    res.json({ success: true, message: 'Your account has been deleted' })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// POST /api/auth/logout
// Cookie hata dete hain aur user ko offline mark karte hain
// ==========================================================
router.post('/logout', protect, async (req, res, next) => {
  try {
    req.user.isOnline = false
    req.user.lastSeen = new Date()
    await req.user.save()

    // Browser se cookie hata do
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined })

    res.json({ success: true, message: 'Logged out' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
