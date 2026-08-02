const express = require('express')
const mongoose = require('mongoose')
const { User, Message } = require('../models')
const { protect } = require('../middleware/protect')
const { getIO } = require('../socket')
const { PUBLIC_FIELDS, withRelations } = require('../utils/relations')

// ==========================================================
// USER ROUTES - /api/users/...
//
// User list + search, ek user ki profile, aur block/pin/archive/hide
// ==========================================================
const router = express.Router()

// Is file ke SAARE routes protected hain
// router.use() ka matlab: har request pehle protect middleware se guzregi
router.use(protect)

// Ye char list "relation" kehlati hain - ek endpoint se sab handle karte hain
const RELATION_FIELDS = {
  blocked: 'blockedUsers',
  pinned: 'pinnedChats',
  archived: 'archivedChats',
  hidden: 'hiddenChats',
  chatList: 'chatList',
}

// ==========================================================
// GET /api/users?search=rahul
// Saare users ki list. search diya to filter karke dete hain
// ==========================================================
router.get('/', async (req, res, next) => {
  try {
    const search = (req.query.search || '').trim()

    const filter = {
      // Apne aap ko list me nahi dikhana - $ne matlab "not equal"
      _id: { $ne: req.user._id },

      // Deleted accounts kisi ko search me nahi milne chahiye
      isDeleted: { $ne: true },
    }

    if (search) {
      // User ka type kiya hua text seedha regex me daalna KHATARNAK hai
      // Agar koi "(((" jaisa likh de to regex crash ho jayega
      // Isliye pehle saare special characters ko escape kar dete hain
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      // $or matlab: naam me mile YA email me mile
      // $options: 'i' matlab chhote-bade letters ka farak nahi
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ]
    }

    const users = await User.find(filter)
      .select(`${PUBLIC_FIELDS} blockedUsers`)
      .sort({ isOnline: -1, name: 1 }) // online users pehle, phir naam ke hisaab se
      .limit(50)                        // ek saath 50 se zyada nahi bhejte
      .lean()

    res.json({ success: true, users: users.map((u) => withRelations(u, req.user)) })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// PUT /api/users/:id/relation
// Ek hi endpoint se block / pin / archive / hide sab handle hota hai
//
// Body me jo bhejo wahi badalta hai:
//   { "blocked": true }   -> block kar do
//   { "pinned": false }   -> unpin kar do
//   { "archived": true }  -> archive kar do
//   { "hidden": true }    -> list se hata do
//
// Alag alag 8 routes banane se achha ek hi route hai - samajhne me bhi aasan
// ==========================================================
router.put('/:id/relation', async (req, res, next) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' })
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot do this to yourself' })
    }

    const target = await User.exists({ _id: id })
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Body me jo valid keys aayi hain unhi ko update karte hain
    const addTo = {}
    const pullFrom = {}

    for (const [key, field] of Object.entries(RELATION_FIELDS)) {
      if (typeof req.body[key] !== 'boolean') continue

      // $addToSet -> pehle se hai to dobara nahi jodta (duplicate nahi bante)
      // $pull    -> array me se nikal deta hai
      if (req.body[key]) addTo[field] = id
      else pullFrom[field] = id
    }

    // "Remove from list" karo to chatList se bhi hata do
    // Warna banda hidden hone ke baad bhi Chats tab me ginta rahega
    if (req.body.hidden === true) pullFrom.chatList = id

    if (!Object.keys(addTo).length && !Object.keys(pullFrom).length) {
      return res.status(400).json({ success: false, message: 'Nothing to update' })
    }

    const update = {}
    if (Object.keys(addTo).length) update.$addToSet = addTo
    if (Object.keys(pullFrom).length) update.$pull = pullFrom

    await User.updateOne({ _id: req.user._id }, update)

    const io = getIO()

    // ---- BLOCK / UNBLOCK par chat me ek system message daal dete hain ----
    // Isse dono ko pata chal jata hai ki kya hua, aur chat me record bhi rehta hai
    if (typeof req.body.blocked === 'boolean') {
      const systemMessage = await Message.create({
        sender: req.user._id,
        receiver: id,
        messageType: 'system',
        // Sirf verb save karte hain - screen par text client banata hai
        // ("You blocked Bob" vs "Alice blocked you")
        text: req.body.blocked ? 'blocked' : 'unblocked',
        isRead: true, // system message ka unread count nahi banna chahiye
      })

      io?.to(id).emit('new-message', systemMessage)
    }

    // Saamne wale ki screen turant update ho jaye
    // (uska input box band/khul jaye, online status chhupe ya dikhe)
    if (io && typeof req.body.blocked === 'boolean') {
      io.to(id).emit('relation-changed', { by: req.user._id.toString() })
    }

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// GET /api/users/:id
// Ek user ki profile dekhne ke liye
// ==========================================================
router.get('/:id', async (req, res, next) => {
  try {
    // Galat format ki id par MongoDB crash kar deta hai, isliye pehle check
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' })
    }

    const user = await User.findById(req.params.id)
      .select(`${PUBLIC_FIELDS} blockedUsers`)
      .lean()

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.json({ success: true, user: withRelations(user, req.user) })
  } catch (err) {
    next(err)
  }
})

module.exports = router
