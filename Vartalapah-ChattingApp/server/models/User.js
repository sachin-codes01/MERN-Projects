const mongoose = require('mongoose')

// ==========================================================
// USER MODEL
// Har logged-in user ki information
// ==========================================================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  // email unique hai - ek email se ek hi account banega
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  // Sirf email+password se signup karne walon ka hota hai (routes/auth.js
  // ka /register). Google se aaye users ka ye null hi rehta hai - unki
  // pehchaan display ke liye "name" se hi chalti hai, poori app me wahi
  // dikhta hai.
  //
  // JAAN-BOOJHKAR unique NAHI hai - asli pehchaan email se hoti hai
  // (login bhi email+password se hota hai, username se nahi). Do alag
  // logon ka username same ho sakta hai, bilkul theek hai
  username: {
    type: String,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_.]+$/,
    default: null,
  },

  // Google login se aane wali profile photo ka URL
  // Baad me user apni photo badle to Cloudinary ka URL yahan aayega
  profileImage: { type: String, default: '' },

  // Cloudinary par photo ki id - photo delete karne ke liye chahiye hoti hai
  profileImageId: { type: String, default: '' },

  // Google ka unique user id - isse pata chalta hai ki ye wahi user hai
  googleId: { type: String, index: true },

  // Bcrypt se hash kiya hua password. Google se pehli baar login karne
  // par ye null hota hai - user ko "Create Password" screen par bhej
  // dete hain. Plaintext KABHI yahan nahi aata, aur select:false hone
  // ki wajah se koi normal query (User.findById waghera) ise apne aap
  // nahi laati - jab chahiye ho tabhi .select('+password') likhna padega
  password: { type: String, default: null, select: false },

  // User abhi online hai ya nahi - Socket.IO connect/disconnect par update hoga
  isOnline: { type: Boolean, default: false },

  // User aakhri baar kab online tha
  lastSeen: { type: Date, default: Date.now },

  // ---- Chat list ki personal settings ----
  // Ye char list har user ki apni hoti hai. Maine kisi ko block/pin kiya
  // iska matlab ye nahi ki uske liye bhi waisa hi hoga

  // Jinhe maine block kiya - wo mujhe message nahi bhej sakte, main bhi unhe nahi
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Jinhe maine pin kiya - list me sabse upar dikhenge
  pinnedChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Jinhe maine archive kiya - alag "Archived" section me chale jate hain
  archivedChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Jinhe maine list se hataya ("Remove from list")
  // Messages delete NAHI hote, sirf list se chhup jate hain
  // Wo dobara message bhejein to apne aap wapas list me aa jate hain
  hiddenChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Jinhe maine kabhi message bheja hai - ye list PAKKI hai
  // Saare messages unsend kar do tab bhi banda "Chats" tab me bana rehta hai
  // Sirf "Remove from list" se hi hatta hai
  chatList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Account delete hone par document mitate NAHI hain, sirf flag laga dete hain
  // Ise "soft delete" kehte hain
  // Kyun? Kyunki purane messages me sender ki id padi hai - user hata denge to
  // saamne wale ki chat toot jayegi. Isliye user ko chhupa dete hain, mitate nahi
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, {
  // timestamps: true se createdAt aur updatedAt apne aap ban jate hain
  timestamps: true,
})

module.exports = mongoose.model('User', userSchema)
