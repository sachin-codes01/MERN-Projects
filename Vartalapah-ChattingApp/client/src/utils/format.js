// ==========================================================
// FORMATTING HELPERS
// Ye sirf data ko "dikhne layak" text me badalte hain -
// koi API call, koi state nahi. Isliye inhe kahin bhi use kar sakte ho
// ==========================================================

// Private chat me sender ek id (string) hoti hai
// Group chat me sender populate hokar poora object aata hai { _id, name, profileImage }
// Ye helper dono case sambhal leta hai
export const senderIdOf = (msg) =>
  typeof msg.sender === 'string' ? msg.sender : msg.sender?._id

// Database ki date ko 12-hour format me badalne ka helper
// hour12: true -> "09:45 pm" (24-hour "21:45" ki jagah)
export const timeOf = (date) =>
  new Date(date)
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase()

// System message ka sidebar preview - database me sirf verb save hota hai
const SYSTEM_PREVIEWS = {
  blocked: 'Blocked',
  unblocked: 'Unblocked',
  screenshot: 'Screenshot taken',
}

// Sidebar me dikhane wala chhota preview text
export const previewOf = (msg) => {
  if (!msg) return 'Tap to start chatting'
  if (msg.messageType === 'image') return '📷 Photo'
  if (msg.messageType === 'video') return '🎥 Video'
  if (msg.messageType === 'system') return SYSTEM_PREVIEWS[msg.text] || 'Update'
  return msg.text
}

// ==========================================================
// SYSTEM MESSAGE KI POORI LINE
//
// Database me sirf ek chhota verb hota hai ("blocked" / "screenshot").
// Poora vaakya yahan banta hai kyunki wo padhne wale ke hisaab se badalta
// hai: ek hi message ek ko "You blocked Bob" dikhta hai aur dusre ko
// "Alice blocked you". Isliye ise server par save karna galat hota
// ==========================================================
export const systemLineOf = (msg, { me, chatName, isGroup }) => {
  const isMine = senderIdOf(msg) === me._id

  // Group me bhejne wale ka naam message ke saath aata hai,
  // private chat me saamne wala hamesha wahi hai jiski chat khuli hai
  const who = isMine ? 'You' : isGroup ? msg.sender?.name || 'Someone' : chatName

  if (msg.text === 'screenshot') {
    return `${who} took a screenshot`
  }

  const verb = msg.text === 'blocked' ? 'blocked' : 'unblocked'

  // "You blocked Bob" lekin "Bob blocked you" - object dono taraf badalta hai
  return isMine ? `You ${verb} ${chatName}` : `${who} ${verb} you`
}

// "Last seen 5 minutes ago" jaisa text banata hai
export const lastSeenText = (date) => {
  if (!date) return 'Offline'

  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)

  if (mins < 1) return 'Last seen just now'
  if (mins < 60) return `Last seen ${mins} min ago`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Last seen ${hours} hour${hours > 1 ? 's' : ''} ago`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'Last seen yesterday'
  return `Last seen ${days} days ago`
}
