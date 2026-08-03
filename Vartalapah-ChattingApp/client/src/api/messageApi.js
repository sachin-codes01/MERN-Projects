import { request } from './httpClient.js'

// ==========================================================
// MESSAGE API - /api/messages/...
//
// Har endpoint ka ek naam wala function. Hooks ab aise likhe jate hain:
//
//   const { messages } = await messageApi.getPrivateChat(userId)
//
// pehle ki tarah nahi:
//
//   const data = await api(`/messages/${userId}`)
//
// Fayda: endpoint ka path ab sirf yahan hai. Backend me route ka
// naam badle to ek jagah badalna padta hai, poore project me dhoondhna
// nahi padta. Aur naye developer ko ek nazar me dikh jata hai ki
// backend kya kya kar sakta hai
// ==========================================================
export const messageApi = {
  // ---------- PADHNA ----------

  // Sidebar ke liye: har chat ka last message + unread count
  getConversations: () => request('/messages/conversations'),

  // Ek user ke saath ki poori chat
  getPrivateChat: (userId) => request(`/messages/${userId}`),

  // Ek group ki poori chat
  getGroupChat: (groupId) => request(`/messages/group/${groupId}`),

  // ---------- BHEJNA ----------

  // Naya message. `payload` me receiver YA group jata hai, dono nahi
  send: (payload) => request('/messages', { method: 'POST', body: payload }),

  // "Sachin took a screenshot." wala system message.
  // Detection client par hoti hai - dekho hooks/chat/useScreenshotDetect.js
  notifyScreenshot: (target) =>
    request('/messages/screenshot', { method: 'POST', body: target }),

  // ---------- BADALNA ----------

  edit: (messageId, text) => request(`/messages/${messageId}`, { method: 'PUT', body: { text } }),

  // Padh liya mark karna (blue tick)
  markPrivateRead: (userId) => request(`/messages/${userId}/read`, { method: 'PUT' }),
  markGroupRead: (groupId) => request(`/messages/group/${groupId}/read`, { method: 'PUT' }),

  // ---------- HATANA ----------
  // Teen alag alag cheezein hain, isliye teen alag naam:

  // Unsend - message DONO taraf se poori tarah mit jata hai (sirf apne message par)
  unsend: (messageId) => request(`/messages/${messageId}`, { method: 'DELETE' }),

  // Delete for me - message sirf MERI screen se hatta hai, saamne wale ko dikhta rehta hai
  deleteForMe: (messageId) => request(`/messages/${messageId}/me`, { method: 'DELETE' }),

  // Ek banda ko bheje hue SAARE messages unsend karna
  unsendAllTo: (userId) => request(`/messages/all/${userId}`, { method: 'DELETE' }),
}
