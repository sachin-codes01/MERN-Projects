const mongoose = require('mongoose')
const { Group } = require('../models')

// ==========================================================
// GROUP HELPERS
// Ye do cheezein routes/groups.js aur routes/messages.js DONO ko
// chahiye. Pehle messages.js seedha groups.js se import karta tha -
// yaani ek route dusre route par depend kar raha tha. Ab dono yahan
// se lete hain, isliye routes ek dusre se aazad hain
// ==========================================================

// Har group ka apna Socket.IO room hota hai
// Room ka naam "group:<groupId>" rakha hai taki user ke room se na takraye
// (user ka room sirf uski id hoti hai)
const roomOf = (groupId) => `group:${groupId}`

// Members ki poori info bhejne ke liye
const MEMBER_FIELDS = 'name email profileImage isOnline lastSeen'

// ==========================================================
// Group nikaalo, lekin sirf tab jab main uska member hoon
//
// Wapas { group } deta hai ya { error: { status, message } }.
// Route bas itna likhta hai:
//   if (error) return res.status(error.status).json(...)
// ==========================================================
const getGroupIfMember = async (groupId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return { error: { status: 400, message: 'Invalid group id' } }
  }

  const group = await Group.findById(groupId)
  if (!group) return { error: { status: 404, message: 'Group not found' } }

  const isMember = group.members.some((m) => m.toString() === userId.toString())
  if (!isMember) return { error: { status: 403, message: 'You are not a member of this group' } }

  return { group }
}

module.exports = { roomOf, MEMBER_FIELDS, getGroupIfMember }
