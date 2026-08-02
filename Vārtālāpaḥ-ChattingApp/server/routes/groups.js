const express = require('express')
const mongoose = require('mongoose')
const { Group, Message, User } = require('../models')
const { protect } = require('../middleware/protect')
const { getIO } = require('../socket')
const { deleteFromCloudinary } = require('../config/cloudinary')
const { roomOf, MEMBER_FIELDS, getGroupIfMember } = require('../utils/groupRooms')

// ==========================================================
// GROUP ROUTES - /api/groups/...
//
// Group banana, dekhna, naam/photo badalna, members add/remove,
// group chhodna aur delete karna
// ==========================================================
const router = express.Router()

// Is file ke saare routes login ke baad hi chalte hain
router.use(protect)

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id)

// ==========================================================
// KISE GROUP ME ADD KAR SAKTE HAIN - ye check karta hai
//
// Rule: sirf unhe add kar sakte ho jinse pehle se baat hui hai
//       (yaani "Chats" ya "Requests" tab wale log)
//       Kisi anjaan aadmi ko group me nahi ghusa sakte
//
// Frontend me picker me sirf wahi log dikhate hain, lekin asli rok yahan hai
// kyunki koi Postman se seedha bhi request bhej sakta hai
// ==========================================================
const validateAddableMembers = async (me, ids) => {
  // 1) Ye log database me hain aur delete to nahi hue
  const found = await User.find({ _id: { $in: ids }, isDeleted: { $ne: true } })
    .select('_id blockedUsers')
    .lean()

  if (found.length !== ids.length) {
    return { ok: false, message: 'Some users were not found' }
  }

  // 2) Block wale logon ko add nahi kar sakte - dono taraf se check
  const myBlocked = (me.blockedUsers || []).map((x) => x.toString())
  const myId = me._id.toString()

  const blocked = found.some(
    (u) =>
      myBlocked.includes(u._id.toString()) ||
      (u.blockedUsers || []).some((x) => x.toString() === myId)
  )

  if (blocked) {
    return { ok: false, message: 'You cannot add a blocked user' }
  }

  // 3) Sabse zaroori: in sabse pehle private chat me baat hui honi chahiye
  // Ek hi query me dono taraf ke messages nikaal lete hain
  const chats = await Message.find({
    group: null,
    $or: [
      { sender: me._id, receiver: { $in: ids } },
      { sender: { $in: ids }, receiver: me._id },
    ],
  })
    .select('sender receiver')
    .lean()

  // Jinse baat hui hai unki ek list bana lete hain
  const talkedTo = new Set()

  chats.forEach((m) => {
    const other = m.sender.toString() === myId ? m.receiver.toString() : m.sender.toString()
    talkedTo.add(other)
  })

  const strangers = ids.filter((id) => !talkedTo.has(id.toString()))

  if (strangers.length > 0) {
    return {
      ok: false,
      message: 'You can only add people you have already chatted with',
    }
  }

  return { ok: true }
}

// ==========================================================
// GET /api/groups
// Mere saare groups - sidebar ke liye last message aur unread count ke saath
// ==========================================================
router.get('/', async (req, res, next) => {
  try {
    // members: req.user._id ka matlab - members array me meri id ho
    const groups = await Group.find({ members: req.user._id })
      .populate('members', MEMBER_FIELDS)
      .populate('admin', MEMBER_FIELDS)
      .sort({ updatedAt: -1 })
      .lean()

    // Har group ka last message aur mere unread messages nikalte hain
    const result = []

    for (const g of groups) {
      const lastMessage = await Message.findOne({ group: g._id })
        .sort({ createdAt: -1 })
        .lean()

      // Unread = group ka message, maine nahi bheja, aur readBy me meri id nahi
      const unreadCount = await Message.countDocuments({
        group: g._id,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      })

      result.push({
        ...g,
        isGroup: true,
        lastMessage,
        unreadCount,
        // Main admin hoon ya nahi - frontend isse buttons dikhata/chhupata hai
        isAdmin: g.admin._id.toString() === req.user._id.toString(),
      })
    }

    res.json({ success: true, groups: result })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// POST /api/groups
// Naya group banana - banane wala apne aap admin ban jata hai
// ==========================================================
router.post('/', async (req, res, next) => {
  try {
    const { name, members = [], groupImage = '', groupImageId = '' } = req.body

    // ---- VALIDATION ----
    const cleanName = String(name || '').trim()
    if (cleanName.length < 2 || cleanName.length > 40) {
      return res.status(400).json({ success: false, message: 'Group name must be 2 to 40 characters' })
    }

    // Sab ids sahi format ki hain?
    if (!Array.isArray(members) || members.some((id) => !isValidId(id))) {
      return res.status(400).json({ success: false, message: 'Invalid member list' })
    }

    // Apni id nikaal do (main to hoon hi), aur duplicate hata do
    const myId = req.user._id.toString()
    const uniqueMembers = [...new Set(members.map(String))].filter((id) => id !== myId)

    if (uniqueMembers.length < 1) {
      return res.status(400).json({ success: false, message: 'Add at least one other member' })
    }

    // Sirf unhe add kar sakte ho jinse pehle se chat hui hai
    const check = await validateAddableMembers(req.user, uniqueMembers)
    if (!check.ok) {
      return res.status(400).json({ success: false, message: check.message })
    }

    const group = await Group.create({
      name: cleanName,
      groupImage,
      groupImageId,
      admin: req.user._id,
      // Admin bhi member hota hai
      members: [req.user._id, ...uniqueMembers],
    })

    const full = await Group.findById(group._id)
      .populate('members', MEMBER_FIELDS)
      .populate('admin', MEMBER_FIELDS)
      .lean()

    const io = getIO()

    if (io) {
      // Saare members ke sockets ko group ke room me daal do
      // io.in(userId).socketsJoin(room) -> us user ke saare open tabs room me aa jate hain
      for (const memberId of full.members) {
        io.in(memberId._id.toString()).socketsJoin(roomOf(group._id))
      }

      // Members ko batao ki naya group bana hai (unke sidebar me turant aa jayega)
      io.to(roomOf(group._id)).emit('group-created', { ...full, isGroup: true })
    }

    res.status(201).json({ success: true, group: { ...full, isGroup: true, isAdmin: true } })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// GET /api/groups/:id
// Group ki poori details - members list ke saath
// ==========================================================
router.get('/:id', async (req, res, next) => {
  try {
    const { group, error } = await getGroupIfMember(req.params.id, req.user._id)
    if (error) return res.status(error.status).json({ success: false, message: error.message })

    const full = await Group.findById(group._id)
      .populate('members', MEMBER_FIELDS)
      .populate('admin', MEMBER_FIELDS)
      .lean()

    res.json({
      success: true,
      group: {
        ...full,
        isGroup: true,
        isAdmin: full.admin._id.toString() === req.user._id.toString(),
      },
    })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// PUT /api/groups/:id
// Group ka naam ya photo badalna - SIRF ADMIN
// ==========================================================
router.put('/:id', async (req, res, next) => {
  try {
    const { group, error } = await getGroupIfMember(req.params.id, req.user._id)
    if (error) return res.status(error.status).json({ success: false, message: error.message })

    // SECURITY: frontend me button chhupana kaafi nahi, asli rok yahan hai
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the admin can edit this group' })
    }

    const { name, groupImage, groupImageId } = req.body

    if (name !== undefined) {
      const cleanName = String(name).trim()
      if (cleanName.length < 2 || cleanName.length > 40) {
        return res.status(400).json({ success: false, message: 'Group name must be 2 to 40 characters' })
      }
      group.name = cleanName
    }

    if (groupImage !== undefined) {
      // Purani photo Cloudinary se hata do warna kachra jamaa hoga
      if (group.groupImageId && group.groupImageId !== groupImageId) {
        await deleteFromCloudinary(group.groupImageId, 'image')
      }
      group.groupImage = String(groupImage)
      group.groupImageId = String(groupImageId || '')
    }

    await group.save()

    const full = await Group.findById(group._id)
      .populate('members', MEMBER_FIELDS)
      .populate('admin', MEMBER_FIELDS)
      .lean()

    // Sabke sidebar me turant naya naam/photo dikh jaye
    getIO()?.to(roomOf(group._id)).emit('group-updated', { ...full, isGroup: true })

    res.json({ success: true, group: { ...full, isGroup: true, isAdmin: true } })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// POST /api/groups/:id/members
// Naye members add karna - SIRF ADMIN
// ==========================================================
router.post('/:id/members', async (req, res, next) => {
  try {
    const { group, error } = await getGroupIfMember(req.params.id, req.user._id)
    if (error) return res.status(error.status).json({ success: false, message: error.message })

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the admin can add members' })
    }

    const { members = [] } = req.body

    if (!Array.isArray(members) || members.length === 0 || members.some((id) => !isValidId(id))) {
      return res.status(400).json({ success: false, message: 'Invalid member list' })
    }

    const existing = group.members.map((m) => m.toString())
    const toAdd = [...new Set(members.map(String))].filter((id) => !existing.includes(id))

    if (toAdd.length === 0) {
      return res.status(400).json({ success: false, message: 'These users are already members' })
    }

    // Yahan bhi wahi rule - sirf jinse baat hui hai unhe hi add kar sakte ho
    const check = await validateAddableMembers(req.user, toAdd)
    if (!check.ok) {
      return res.status(400).json({ success: false, message: check.message })
    }

    // $addToSet -> pehle se hai to dobara nahi jodta
    group.members.push(...toAdd)
    await group.save()

    const full = await Group.findById(group._id)
      .populate('members', MEMBER_FIELDS)
      .populate('admin', MEMBER_FIELDS)
      .lean()

    const io = getIO()

    if (io) {
      // Naye members ke sockets ko room me daal do, warna unhe live messages nahi milenge
      for (const id of toAdd) io.in(id).socketsJoin(roomOf(group._id))

      io.to(roomOf(group._id)).emit('group-updated', { ...full, isGroup: true })
    }

    res.json({ success: true, group: { ...full, isGroup: true, isAdmin: true } })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// DELETE /api/groups/:id/members/:userId
// Member hatana (admin) ya khud group chhodna (koi bhi member)
// ==========================================================
router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    const { group, error } = await getGroupIfMember(req.params.id, req.user._id)
    if (error) return res.status(error.status).json({ success: false, message: error.message })

    const { userId } = req.params
    if (!isValidId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' })
    }

    const myId = req.user._id.toString()
    const isAdmin = group.admin.toString() === myId
    const isLeavingSelf = userId === myId

    // Admin kisi ko bhi nikaal sakta hai, baaki log sirf khud ja sakte hain
    if (!isAdmin && !isLeavingSelf) {
      return res.status(403).json({ success: false, message: 'Only the admin can remove members' })
    }

    // Admin khud nahi ja sakta jab tak group me aur log hain
    // Warna group bina admin ke reh jayega
    if (isLeavingSelf && isAdmin && group.members.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot leave. Delete the group instead.',
      })
    }

    group.members = group.members.filter((m) => m.toString() !== userId)
    await group.save()

    const io = getIO()

    if (io) {
      // Uske sockets ko room se nikaal do - ab use group ke messages nahi milenge
      io.in(userId).socketsLeave(roomOf(group._id))

      // Nikale gaye user ko alag se batao taki uske sidebar se group hat jaye
      io.to(userId).emit('group-removed', { _id: group._id.toString() })

      const full = await Group.findById(group._id)
        .populate('members', MEMBER_FIELDS)
        .populate('admin', MEMBER_FIELDS)
        .lean()

      io.to(roomOf(group._id)).emit('group-updated', { ...full, isGroup: true })
    }

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// ==========================================================
// DELETE /api/groups/:id
// Poora group delete karna - SIRF ADMIN
// Group ke saare messages aur unki media files bhi hat jati hain
// ==========================================================
router.delete('/:id', async (req, res, next) => {
  try {
    const { group, error } = await getGroupIfMember(req.params.id, req.user._id)
    if (error) return res.status(error.status).json({ success: false, message: error.message })

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the admin can delete this group' })
    }

    // Group ke media messages ki files Cloudinary se hata do
    const mediaMessages = await Message.find({
      group: group._id,
      mediaPublicId: { $ne: '' },
    }).lean()

    for (const msg of mediaMessages) {
      await deleteFromCloudinary(msg.mediaPublicId, msg.messageType)
    }

    // Group ki photo bhi
    if (group.groupImageId) await deleteFromCloudinary(group.groupImageId, 'image')

    await Message.deleteMany({ group: group._id })
    await group.deleteOne()

    const io = getIO()

    if (io) {
      io.to(roomOf(group._id)).emit('group-removed', { _id: group._id.toString() })
      // Room khali kar do
      io.in(roomOf(group._id)).socketsLeave(roomOf(group._id))
    }

    res.json({ success: true, message: 'Group deleted' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
