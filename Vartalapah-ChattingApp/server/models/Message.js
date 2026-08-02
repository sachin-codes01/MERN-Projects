const mongoose = require('mongoose')

// ==========================================================
// MESSAGE MODEL
// Private chat aur group chat - dono ke messages isi collection me hain
// ==========================================================
const messageSchema = new mongoose.Schema({
  // Message kisne bheja
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Private chat me receiver bharenge, group chat me group bharenge
  // Dono me se ek hi hoga
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },

  // Message kis type ka hai
  // "system" wo message hai jo app khud banati hai (jaise "blocked" / "unblocked")
  // Wo beech me chhote text ki tarah dikhta hai, bubble me nahi
  messageType: { type: String, enum: ['text', 'image', 'video', 'system'], default: 'text' },

  text: { type: String, default: '' },

  // Image/video ka Cloudinary URL aur uski id
  mediaUrl: { type: String, default: '' },
  mediaPublicId: { type: String, default: '' },

  // Private chat me: message padha gaya ya nahi (blue tick ke liye)
  isRead: { type: Boolean, default: false },

  // Group chat me isRead kaam nahi karta - group me 10 log ho sakte hain
  // Isliye yahan un sabki id rakhte hain jinhone message padh liya
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Message edit hua tha ya nahi - UI me "edited" dikhane ke liye
  isEdited: { type: Boolean, default: false },
}, {
  timestamps: true,
})

// Do users ke beech ke messages jaldi dhoondhne ke liye index
// Index se MongoDB ko poora collection scan nahi karna padta
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 })
messageSchema.index({ group: 1, createdAt: -1 })

module.exports = mongoose.model('Message', messageSchema)
