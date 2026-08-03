const express = require('express')
const mongoose = require('mongoose')
const { Message, User } = require('../models')
const { protect } = require('../middleware/protect')
const { getIO } = require('../socket')
const { deleteFromCloudinary } = require('../config/cloudinary')
const { isBlockedBetween, withRelations, PUBLIC_FIELDS } = require('../utils/relations')
const { roomOf, getGroupIfMember } = require('../utils/groupRooms')

// ==========================================================
// MESSAGE ROUTES - /api/messages/...
//
// Sidebar ki conversation list, ek chat ke messages, message
// bhejna, edit, delete aur "padh liya" mark karna
// ==========================================================
const router = express.Router()

// Is file ke saare routes login ke baad hi chalenge
router.use(protect)

// Galat format ki id par MongoDB crash kar deta hai, isliye har jagah check karte hain
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id)

// "Delete for me" wale messages sirf USI banda se chhupte hain jisne unhe
// hataya. Isliye har chat query me ye filter lagta hai
const notDeletedFor = (userId) => ({ deletedFor: { $ne: userId } })

// Reply wale message me original ka chhota sa preview chahiye hota hai
// (text/photo aur bhejne wale ka naam) - poora message nahi
const REPLY_POPULATE = {
  path: 'replyTo',
  select: 'text messageType mediaUrl sender',
  populate: { path: 'sender', select: 'name' },
}

// ==========================================================
// GET /api/messages/conversations
// Sidebar ke liye: har user ka last message + kitne unread hain
//
// NOTE: ye route "/:userId" se PEHLE likhna zaroori hai
// warna Express "conversations" ko ek userId samajh lega
// ==========================================================
router.get('/conversations', async (req, res, next) => {
  try {
    const myId = req.user._id.toString()

    // Mere saare private messages (jo maine bheje ya mujhe mile)
    const messages = await Message.find({
      group: null,
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      ...notDeletedFor(req.user._id),
    })
      .sort({ createdAt: -1 }) // naye pehle
      .lean()                  // plain JS object milta hai, thoda tez hota hai

    // Har dusre user ke liye uska last message, unread count aur do flags
    const map = {}

    for (const msg of messages) {
      const senderId = msg.sender.toString()
      const receiverId = msg.receiver.toString()

      // Saamne wala kaun hai
      const otherId = senderId === myId ? receiverId : senderId

      if (!map[otherId]) {
        // Pehla message mila matlab yahi latest hai (list already sorted hai)
        map[otherId] = {
          userId: otherId,
          lastMessage: msg,
          unreadCount: 0,

          // Ye do flags se frontend ke tabs bante hain:
          //   iReplied = true          -> "Chats" tab me dikhega
          //   theyMessaged && !iReplied -> "Requests" tab me dikhega
          iReplied: false,
          theyMessaged: false,
        }
      }

      if (senderId === myId) map[otherId].iReplied = true
      else map[otherId].theyMessaged = true

      // Unread wahi hai jo DUSRE ne bheja ho aur maine padha na ho
      if (receiverId === myId && !msg.isRead) {
        map[otherId].unreadCount++
      }
    }

    // Ab in users ki basic info bhi bhej dete hain
    // Deleted users bhi shamil hain - taki purani chat gayab na ho jaye
    const otherIds = Object.keys(map)

    const users = await User.find({ _id: { $in: otherIds } })
      .select(`${PUBLIC_FIELDS} blockedUsers`)
      .lean()

    users.forEach((u) => {
      map[u._id.toString()].user = withRelations(u, req.user)
    })

    res.json({ success: true, conversations: Object.values(map) })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// GET /api/messages/group/:groupId
// Ek group ki poori chat
//
// Ye route "/:userId" se PEHLE likhna zaroori hai
// warna Express "group" ko ek userId samajh lega
// ==========================================================
router.get('/group/:groupId', async (req, res, next) => {
  try {
    const { groupId } = req.params

    // Member nahi ho to messages nahi milenge
    const { error } = await getGroupIfMember(groupId, req.user._id)
    if (error) return res.status(error.status).json({ success: false, message: error.message })

    const messages = await Message.find({ group: groupId, ...notDeletedFor(req.user._id) })
      // populate se sender ki jagah uska poora object aa jata hai
      // Group me har message ke upar bhejne wale ka naam dikhana hota hai
      .populate('sender', 'name profileImage')
      .populate(REPLY_POPULATE)
      .sort({ createdAt: 1 }) // purane pehle
      .limit(100)
      .lean()

    res.json({ success: true, messages })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// PUT /api/messages/group/:groupId/read
// Group ke messages ko "padh liya" mark karna
// ==========================================================
router.put('/group/:groupId/read', async (req, res, next) => {
  try {
    const { groupId } = req.params

    const { error } = await getGroupIfMember(groupId, req.user._id)
    if (error) return res.status(error.status).json({ success: false, message: error.message })

    // Group me isRead kaam nahi karta (10 log ho sakte hain)
    // Isliye readBy array me apni id daal dete hain
    await Message.updateMany(
      { group: groupId, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    )

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// GET /api/messages/:userId
// Ek user ke saath ki poori chat
// ==========================================================
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params
    if (!isValidId(userId)) {
      return res.status(400).json({ success: false, message: 'Galat user id' })
    }

    // Dono taraf ke messages chahiye:
    // maine usko bheje + usne mujhe bheje
    const messages = await Message.find({
      group: null,
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
      ...notDeletedFor(req.user._id),
    })
      .populate(REPLY_POPULATE)
      .sort({ createdAt: 1 }) // purane pehle, taki chat sahi order me dikhe
      .limit(100)
      .lean()

    res.json({ success: true, messages })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// POST /api/messages
// Naya message bhejna (CREATE)
// ==========================================================
router.post('/', async (req, res, next) => {
  try {
    const {
      receiver, group, text,
      messageType = 'text', mediaUrl = '', mediaPublicId = '',
      replyTo = null, isForwarded = false,
    } = req.body

    // Ek message ya to kisi USER ko jata hai ya kisi GROUP me - dono nahi
    if (!receiver && !group) {
      return res.status(400).json({ success: false, message: 'Receiver or group is required' })
    }
    if (receiver && group) {
      return res.status(400).json({ success: false, message: 'Send to a user or a group, not both' })
    }

    // ---- VALIDATION (dono ke liye common) ----
    // Frontend par validation pehle se hai, lekin backend par dobara karte hain
    // kyunki koi Postman se bhi request bhej sakta hai
    if (!['text', 'image', 'video'].includes(messageType)) {
      return res.status(400).json({ success: false, message: 'Invalid message type' })
    }

    const cleanText = (text || '').trim()

    if (messageType === 'text') {
      if (!cleanText) {
        return res.status(400).json({ success: false, message: 'Message cannot be empty' })
      }
      if (cleanText.length > 2000) {
        return res.status(400).json({ success: false, message: 'Message is too long' })
      }
    } else if (!mediaUrl) {
      return res.status(400).json({ success: false, message: 'Media URL missing' })
    }

    // ---- REPLY VALIDATION ----
    // Reply usi chat ke message ka ho sakta hai jisme bhej rahe ho. Warna
    // koi Postman se kisi aur ki private chat ka message quote karwa sakta hai
    if (replyTo) {
      if (!isValidId(replyTo)) {
        return res.status(400).json({ success: false, message: 'Invalid reply id' })
      }

      const original = await Message.findById(replyTo).select('sender receiver group').lean()
      if (!original) {
        return res.status(404).json({ success: false, message: 'Original message not found' })
      }

      const myId = req.user._id.toString()

      // Group me: original bhi usi group ka ho
      // Private me: original inhi do logon ke beech ka ho
      const sameChat = group
        ? original.group?.toString() === group
        : !original.group &&
          [original.sender?.toString(), original.receiver?.toString()].sort().join() ===
            [myId, receiver].sort().join()

      if (!sameChat) {
        return res.status(400).json({ success: false, message: 'Cannot reply to that message' })
      }
    }

    // Forward kiya hua message apni hi Cloudinary file "adopt" nahi kar
    // sakta - warna forward delete karne par original ki image tooti reh
    // jaati. Isliye forward me publicId hamesha khali rehti hai
    const publicId = isForwarded ? '' : mediaPublicId

    // ==================== GROUP MESSAGE ====================
    if (group) {
      // Member hoon ya nahi - helper khud check kar leta hai
      const { error } = await getGroupIfMember(group, req.user._id)
      if (error) {
        return res.status(error.status).json({ success: false, message: error.message })
      }

      const message = await Message.create({
        sender: req.user._id,
        group,
        messageType,
        text: messageType === 'text' ? cleanText : '',
        mediaUrl,
        mediaPublicId: publicId,
        replyTo: replyTo || null,
        isForwarded: !!isForwarded,
        // Apna hi message hai, isliye maine to padh hi liya
        readBy: [req.user._id],
      })

      // Sender ka naam chahiye hota hai - group me har message ke upar naam dikhta hai
      const full = await Message.findById(message._id)
        .populate('sender', 'name profileImage')
        .populate(REPLY_POPULATE)
        .lean()

      // Group ke room me sabko bhej do
      // Group ka room "group:<id>" hai, isliye sirf uske members ko milega
      getIO()?.to(roomOf(group)).emit('new-message', full)

      return res.status(201).json({ success: true, message: full })
    }

    // ==================== PRIVATE MESSAGE ====================
    if (!isValidId(receiver)) {
      return res.status(400).json({ success: false, message: 'Invalid receiver id' })
    }

    // Apne aap ko message nahi bhej sakte
    if (receiver === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot message yourself' })
    }

    // Receiver database me hai bhi ya nahi
    const receiverExists = await User.exists({ _id: receiver })
    if (!receiverExists) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // ---- BLOCK CHECK ----
    // Frontend me input band kar diya hai, lekin koi Postman se bhi bhej sakta hai
    // Isliye asli rok yahan lagti hai
    const blocked = await isBlockedBetween(req.user._id, receiver)
    if (blocked) {
      return res.status(403).json({
        success: false,
        message: 'You cannot message this user',
      })
    }

    // Database me save
    const created = await Message.create({
      sender: req.user._id,
      receiver,
      messageType,
      text: messageType === 'text' ? cleanText : '',
      mediaUrl,
      mediaPublicId: publicId,
      replyTo: replyTo || null,
      isForwarded: !!isForwarded,
    })

    // Reply ka preview client ko turant chahiye, isliye populate karke bhejte hain
    const message = await Message.findById(created._id).populate(REPLY_POPULATE).lean()

    // Do cheezein ek saath:
    // 1. Receiver ne mujhe list se hataya tha -> naya message aate hi wapas aa jaata hoon
    // 2. Ye banda ab pakke taur par meri "Chats" list me aa jata hai
    //    (baad me saare messages unsend kar dun tab bhi list me bana rahega)
    await Promise.all([
      User.updateOne({ _id: receiver }, { $pull: { hiddenChats: req.user._id } }),
      User.updateOne({ _id: req.user._id }, { $addToSet: { chatList: receiver } }),
    ])

    // ---- REAL TIME ----
    // io.to(receiver) -> sirf us receiver ke room me event bhejo
    // Isse receiver ki screen par message turant aa jata hai, bina refresh ke
    getIO()?.to(receiver).emit('new-message', message)

    res.status(201).json({ success: true, message })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// POST /api/messages/screenshot
// "Sachin took a screenshot." wala system message
//
// Body: { receiver } ya { group }
//
// Browser me screenshot ka koi API nahi hai - ye route sirf tab chalta
// hai jab client sach me screenshot pakad le (native wrapper ka event,
// ya desktop par PrintScreen / Cmd+Shift+3). Detection ka poora zimma
// client ka hai, dekho client/src/hooks/useScreenshotDetect.js
// ==========================================================
router.post('/screenshot', async (req, res, next) => {
  try {
    const { receiver, group } = req.body

    if (!receiver && !group) {
      return res.status(400).json({ success: false, message: 'Receiver or group is required' })
    }

    // Ek hi screenshot par kabhi kabhi do event aa jate hain (aur client
    // par bug ho to spam bhi ho sakta hai). Isliye 5 second ke andar
    // dusra notice nahi banate
    const since = new Date(Date.now() - 5000)
    const recent = await Message.exists({
      sender: req.user._id,
      messageType: 'system',
      text: 'screenshot',
      ...(group ? { group } : { receiver }),
      createdAt: { $gte: since },
    })

    if (recent) return res.json({ success: true, message: null, skipped: true })

    if (group) {
      const { error } = await getGroupIfMember(group, req.user._id)
      if (error) return res.status(error.status).json({ success: false, message: error.message })

      const created = await Message.create({
        sender: req.user._id,
        group,
        messageType: 'system',
        text: 'screenshot',
        readBy: [req.user._id],
      })

      const full = await Message.findById(created._id)
        .populate('sender', 'name profileImage')
        .lean()

      getIO()?.to(roomOf(group)).emit('new-message', full)

      return res.status(201).json({ success: true, message: full })
    }

    if (!isValidId(receiver)) {
      return res.status(400).json({ success: false, message: 'Invalid receiver id' })
    }

    // Block hai to notice bhi nahi jana chahiye
    if (await isBlockedBetween(req.user._id, receiver)) {
      return res.status(403).json({ success: false, message: 'You cannot message this user' })
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      messageType: 'system',
      text: 'screenshot',
      isRead: true, // system message ka unread badge nahi banna chahiye
    })

    getIO()?.to(receiver).emit('new-message', message)

    res.status(201).json({ success: true, message })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// DELETE /api/messages/all/:userId
// Us user ko maine jitne bhi messages bheje the, sab unsend kar do
//
// Dhyan do: sirf MERE bheje hue messages hatate hain
// Uske bheje hue messages waise hi rehte hain - wo uske hain, mere nahi
//
// Ye route "/:id" se PEHLE likhna zaroori hai warna Express "all" ko
// ek message id samajh lega
// ==========================================================
router.delete('/all/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params
    if (!isValidId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' })
    }

    // Sirf mere bheje hue messages
    const myMessages = await Message.find({
      sender: req.user._id,
      receiver: userId,
      group: null,
    })

    if (myMessages.length === 0) {
      return res.json({ success: true, deletedCount: 0 })
    }

    // Photo/video wale messages ki files Cloudinary se bhi hata do
    for (const msg of myMessages) {
      if (msg.mediaPublicId) {
        await deleteFromCloudinary(msg.mediaPublicId, msg.messageType)
      }
    }

    const ids = myMessages.map((m) => m._id.toString())

    await Message.deleteMany({ _id: { $in: ids } })

    // Saamne wale ki screen se bhi turant hata do
    getIO()?.to(userId).emit('messages-bulk-deleted', { ids })

    res.json({ success: true, deletedCount: ids.length })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// PUT /api/messages/:id
// Message edit karna (UPDATE)
// ==========================================================
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Galat message id' })
    }

    const message = await Message.findById(id)
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' })
    }

    // SECURITY: sirf apna message edit kar sakte ho
    // Frontend me button chhupa dena kaafi nahi hai - backend par check zaroori hai
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'This message is not yours' })
    }

    // Photo/video ka text edit nahi hota
    if (message.messageType !== 'text') {
      return res.status(400).json({ success: false, message: 'Only text messages can be edited' })
    }

    const cleanText = (req.body.text || '').trim()
    if (!cleanText) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' })
    }

    message.text = cleanText
    message.isEdited = true
    await message.save()

    // Group ka message hai to group ke room me, warna sirf receiver ko
    const target = message.group ? roomOf(message.group.toString()) : message.receiver.toString()

    // Group me sender ka naam bhi chahiye hota hai
    const updated = message.group
      ? await Message.findById(message._id).populate('sender', 'name profileImage').lean()
      : message

    // Dusri screens par bhi turant update ho jaye
    getIO()?.to(target).emit('message-updated', updated)

    res.json({ success: true, message: updated })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// DELETE /api/messages/:id/me
// "Delete for me" - message sirf MERI screen se hatta hai
//
// Unsend se farak: unsend message ko dono taraf se mita deta hai aur
// sirf apne message par chalta hai. Delete-for-me kisi bhi message par
// chalta hai kyunki wo kisi aur ko dikhai hi nahi deta
//
// Ye route "/:id" se PEHLE likhna zaroori hai
// ==========================================================
router.delete('/:id/me', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid message id' })
    }

    const message = await Message.findById(id).select('sender receiver group').lean()
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' })
    }

    // Sirf usi chat ka member message hata sakta hai jisme wo message hai
    const myId = req.user._id.toString()

    const inMyChat = message.group
      ? !(await getGroupIfMember(message.group.toString(), req.user._id)).error
      : [message.sender?.toString(), message.receiver?.toString()].includes(myId)

    if (!inMyChat) {
      return res.status(403).json({ success: false, message: 'This message is not in your chat' })
    }

    // $addToSet -> dobara delete karne par duplicate entry nahi banti
    await Message.updateOne({ _id: id }, { $addToSet: { deletedFor: req.user._id } })

    // Koi socket event nahi - ye sirf mere liye hai. Mere dusre tabs par
    // reload par apne aap sahi ho jayega
    res.json({ success: true, message: 'Message deleted for you' })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// DELETE /api/messages/:id
// Message unsend karna (DELETE)
// ==========================================================
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Galat message id' })
    }

    const message = await Message.findById(id)
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' })
    }

    // SECURITY: sirf apna message delete kar sakte ho
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'This message is not yours' })
    }

    // Group ka message hai to group ke room me, warna sirf receiver ko
    const target = message.group ? roomOf(message.group.toString()) : message.receiver.toString()

    // Photo/video wala message hai to Cloudinary se file bhi hata do
    // Warna storage me kachra jamaa hota rahega
    if (message.mediaPublicId) {
      await deleteFromCloudinary(message.mediaPublicId, message.messageType)
    }

    await message.deleteOne()

    getIO()?.to(target).emit('message-deleted', { _id: id })

    res.json({ success: true, message: 'Message unsent' })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// PUT /api/messages/:userId/read
// Us user ke saare messages ko "padh liya" mark karna (blue tick)
// ==========================================================
router.put('/:userId/read', async (req, res, next) => {
  try {
    const { userId } = req.params
    if (!isValidId(userId)) {
      return res.status(400).json({ success: false, message: 'Galat user id' })
    }

    // updateMany -> ek saath saare unread messages update
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, isRead: false },
      { isRead: true }
    )

    // Bhejne wale ko batao ki uske messages padh liye gaye (blue tick)
    getIO()?.to(userId).emit('messages-read', { by: req.user._id.toString() })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
