import { request } from './httpClient.js'

// ==========================================================
// GROUP API - /api/groups/...
//
// Backend har jagah check karta hai ki main member hoon ya nahi, aur
// rename/add/remove/delete sirf admin kar sakta hai. Frontend me
// button chhupana sirf dikhawa hai - asli rok server par hai
// ==========================================================
export const groupApi = {
  list: () => request('/groups'),

  create: ({ name, memberIds, groupImage, groupImageId }) =>
    request('/groups', {
      method: 'POST',
      body: { name, members: memberIds, groupImage, groupImageId },
    }),

  // Naam aur photo badalna (sirf admin)
  update: (groupId, changes) => request(`/groups/${groupId}`, { method: 'PUT', body: changes }),

  addMembers: (groupId, memberIds) =>
    request(`/groups/${groupId}/members`, { method: 'POST', body: { members: memberIds } }),

  // Ek hi endpoint do kaam karta hai:
  //   dusre ki id do  -> use nikaal do (sirf admin kar sakta hai)
  //   apni id do      -> khud group chhod do
  removeMember: (groupId, memberId) =>
    request(`/groups/${groupId}/members/${memberId}`, { method: 'DELETE' }),

  // Poora group mita do (sirf admin). Uski saari media Cloudinary se bhi hat jati hai
  remove: (groupId) => request(`/groups/${groupId}`, { method: 'DELETE' }),
}
