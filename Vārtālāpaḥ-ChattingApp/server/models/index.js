// ==========================================================
// SAARE MODELS EK JAGAH SE
//
// Har model apni alag file me hai (User.js, Group.js, Message.js).
// Ye file sirf unhe ek saath export karti hai, taki baaki code me
// teen alag alag require likhne ki zarurat na pade:
//
//   const { User, Message } = require('../models')
//
// Node khud samajh jata hai ki folder me index.js hi khulni hai
// ==========================================================
const User = require('./User')
const Group = require('./Group')
const Message = require('./Message')

module.exports = { User, Group, Message }
