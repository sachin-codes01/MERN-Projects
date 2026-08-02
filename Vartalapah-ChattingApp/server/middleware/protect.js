const jwt = require('jsonwebtoken')
const { User } = require('../models')
const { COOKIE_NAME } = require('../utils/token')

// ==========================================================
// AUTH MIDDLEWARE
// Ye har protected route se PEHLE chalta hai
//
// Kaam: cookie se token nikalo -> verify karo -> user ko req.user me daal do
//
// "Middleware" ka matlab: ek function jo request aur route ke beech
// me khada rehta hai. next() call karo to request aage badhti hai,
// res.json() kar do to request wahi ruk jati hai
// ==========================================================
const protect = async (req, res, next) => {
  try {
    const token = req.cookies[COOKIE_NAME]

    // Token hai hi nahi matlab user logged in nahi hai
    if (!token) {
      return res.status(401).json({ success: false, message: 'Please log in first' })
    }

    // Token verify karo - agar kisi ne token se chhed-chhad ki hogi to yahan error aayega
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Token me sirf id thi, ab poora user database se laate hain
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    // Account delete ho chuka hai to purana token bhi kaam nahi karna chahiye
    if (user.isDeleted) {
      return res.status(401).json({ success: false, message: 'This account has been deleted' })
    }

    // Aage wale route ko user mil jaye isliye req me daal dete hain
    req.user = user
    next()
  } catch (err) {
    // Token galat hai ya expire ho gaya
    res.status(401).json({ success: false, message: 'Session expired, please log in again' })
  }
}

module.exports = { protect }
