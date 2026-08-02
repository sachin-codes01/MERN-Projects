const mongoose = require('mongoose')

// ==========================================================
// GROUP MODEL
// Ek group = ek naam, ek admin aur members ki list
// ==========================================================
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  groupImage: { type: String, default: '' },
  groupImageId: { type: String, default: '' },

  // admin ek User ki id hai - ref se pata chalta hai kis collection se jodna hai
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // members me kai users ki id hoti hai (array of references)
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true,
})

module.exports = mongoose.model('Group', groupSchema)
