import { request } from './httpClient.js'

// ==========================================================
// AUTH API - /api/auth/...
//
// ---- LOGIN KAISE CHALTA HAI (interview me poocha jata hai) ----
//
//  1. User "Sign in with Google" dabata hai
//  2. Google apna credential (ek JWT) frontend ko deta hai
//  3. Frontend wo credential loginWithGoogle() se backend ko bhejta hai
//  4. Backend google-auth-library se verify karta hai ki token SACH ME
//     Google ka hai (frontend par bharosa nahi kiya jata)
//  5. Backend apna JWT banakar httpOnly COOKIE me bhejta hai
//
// Token localStorage me nahi rakha jata - httpOnly cookie JavaScript
// se padhi hi nahi ja sakti, isliye XSS attack me churayi nahi ja sakti.
// Isiliye har request me credentials:'include' hota hai (httpClient.js)
// ==========================================================
export const authApi = {
  // Page khulte hi ye chalta hai - cookie abhi valid hai ya nahi
  getCurrentUser: () => request('/auth/me'),

  // credential = Google ka diya hua token
  loginWithGoogle: (credential) =>
    request('/auth/google', { method: 'POST', body: { credential } }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  updateProfile: (updates) => request('/auth/me', { method: 'PUT', body: updates }),

  // Soft delete - user "deleted" mark hota hai lekin uske bheje hue
  // messages saamne wale ki chat me bane rehte hain
  deleteAccount: () => request('/auth/me', { method: 'DELETE' }),
}
