// ==========================================================
// SAARE MODELS EK JAGAH SE
//
// Har model apni alag file me hai (User.js, Group.js, Message.js,
// EmailOtp.js). Ye file sirf unhe ek saath export karti hai, taki
// baaki code me alag alag require likhne ki zarurat na pade:
//
//   const { User, Message } = require('../models')
//
// Node khud samajh jata hai ki folder me index.js hi khulni hai
// ==========================================================
const User = require('./User')
const Group = require('./Group')
const Message = require('./Message')
const EmailOtp = require('./EmailOtp')

module.exports = { User, Group, Message, EmailOtp }
