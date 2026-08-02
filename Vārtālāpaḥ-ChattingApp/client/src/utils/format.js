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

// Sidebar me dikhane wala chhota preview text
export const previewOf = (msg) => {
  if (!msg) return 'Tap to start chatting'
  if (msg.messageType === 'image') return '📷 Photo'
  if (msg.messageType === 'video') return '🎥 Video'
  // System message ka verb ("blocked") sidebar me akela ajeeb lagta hai
  if (msg.messageType === 'system') return msg.text === 'blocked' ? 'Blocked' : 'Unblocked'
  return msg.text
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
