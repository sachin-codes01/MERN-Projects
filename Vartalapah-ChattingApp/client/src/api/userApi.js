import { request } from './httpClient.js'

// ==========================================================
// USER API - /api/users/...
// ==========================================================
export const userApi = {
  // Saare users. search dene par server par hi filter ho jata hai
  // (list badi ho sakti hai, isliye client par nahi chhaante)
  list: (search = '') => {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
    return request(`/users${query}`)
  },

  // ==========================================================
  // Block / pin / archive / hide - sabke liye EK hi endpoint
  //
  // Backend jaan boojhkar aise bana hai: chaar alag route banane se
  // chaaron me wahi validation copy karni padti. Ab body me jo key
  // bhejo wahi badalti hai:
  //   { blocked: true }  { pinned: false }  { archived: true }  { hidden: true }
  // ==========================================================
  updateRelation: (userId, changes) =>
    request(`/users/${userId}/relation`, { method: 'PUT', body: changes }),
}
