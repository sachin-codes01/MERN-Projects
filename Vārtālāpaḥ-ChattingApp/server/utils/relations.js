const { User } = require('../models')

// ==========================================================
// RELATION HELPERS
// "Relation" matlab do users ka aapas ka rishta - block, pin,
// archive, hidden. Ye poori app me kai jagah chahiye hota hai
// (users route, messages route, socket), isliye ek hi jagah rakha hai
// ==========================================================

// Frontend ko user ka safe version hi bhejte hain (googleId waghera nahi)
const PUBLIC_FIELDS = 'name email profileImage isOnline lastSeen createdAt isDeleted'

// ==========================================================
// BLOCK CHECK
// Do users ke beech block hai ya nahi - dono taraf se check karta hai
//
// Block ek taraf se lagta hai lekin asar DONO taraf hota hai (WhatsApp jaisa):
//   - Maine A ko block kiya -> A mujhe message nahi bhej sakta
//   - Aur main bhi A ko message nahi bhej sakta jab tak unblock na karun
// ==========================================================
const isBlockedBetween = async (userA, userB) => {
  const found = await User.exists({
    $or: [
      { _id: userA, blockedUsers: userB },
      { _id: userB, blockedUsers: userA },
    ],
  })

  return !!found
}

// ==========================================================
// Ek user ke saath mera kya rishta hai, wo extra fields jodta hai
// Frontend ko isi se pata chalta hai ki Block dikhana hai ya Unblock,
// pin hai ya nahi, message bhej sakte hain ya nahi
// ==========================================================
const withRelations = (targetUser, me) => {
  const myId = me._id.toString()
  const targetId = targetUser._id.toString()

  const has = (list) => (me[list] || []).some((x) => x.toString() === targetId)

  const iBlockedThem = has('blockedUsers')
  const theyBlockedMe = (targetUser.blockedUsers || []).some((x) => x.toString() === myId)
  const deleted = !!targetUser.isDeleted

  // blockedUsers list frontend ko nahi bhejni - wo private hai
  const clean = { ...targetUser }
  delete clean.blockedUsers

  return {
    ...clean,
    isBlocked: iBlockedThem,
    isPinned: has('pinnedChats'),
    isArchived: has('archivedChats'),
    isHidden: has('hiddenChats'),

    // Ek baar message bhej diya to ye pakka "Chats" tab me rahega
    // Chahe baad me saare messages unsend kar do
    inChatList: has('chatList'),

    // Message bhej sakte hain ya nahi
    canMessage: !iBlockedThem && !theyBlockedMe && !deleted,

    // Block ya deleted ho to online status chhupa dete hain (WhatsApp jaisa)
    isOnline: iBlockedThem || theyBlockedMe || deleted ? false : targetUser.isOnline,
    lastSeen: iBlockedThem || theyBlockedMe || deleted ? null : targetUser.lastSeen,
  }
}

module.exports = { PUBLIC_FIELDS, isBlockedBetween, withRelations }
