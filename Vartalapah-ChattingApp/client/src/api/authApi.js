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

  // Email + password se login - Google ke bina bhi wahi account khul jata hai
  loginWithPassword: (email, password, rememberMe) =>
    request('/auth/login', { method: 'POST', body: { email, password, rememberMe } }),

  // Naya account - username + email + password. credential = Google se
  // usi email ki malikiyat verify karne wala token (dekho Signup.jsx) -
  // iske bina backend account banata hi nahi. Success hote hi login
  // bhi kar deta hai (JWT cookie)
  register: (username, email, password, confirmPassword, credential) =>
    request('/auth/register', { method: 'POST', body: { username, email, password, confirmPassword, credential } }),

  // Google se pehli baar aaya user - apna application password banata hai
  setPassword: (password, confirmPassword) =>
    request('/auth/set-password', { method: 'POST', body: { password, confirmPassword } }),

  // "Forgot password" ka STEP 1 - email se check karte hain account hai
  // ya nahi, aur Google se bana hai ya nahi
  checkEmail: (email) => request('/auth/check-email', { method: 'POST', body: { email } }),

  // "Forgot password" ke Step 2 (Google verify) ke turant baad - kya is
  // Google email ka koi account YAHAN hai? Password form dikhane se
  // pehle hi confirm kar lete hain
  checkGoogleAccount: (credential) =>
    request('/auth/google-check', { method: 'POST', body: { credential } }),

  // "Forgot password" - Google se dobara pehchaan karke naya password banate hain
  resetPassword: (credential, password, confirmPassword) =>
    request('/auth/reset-password', { method: 'POST', body: { credential, password, confirmPassword } }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  updateProfile: (updates) => request('/auth/me', { method: 'PUT', body: updates }),

  // Soft delete - user "deleted" mark hota hai lekin uske bheje hue
  // messages saamne wale ki chat me bane rehte hain
  deleteAccount: () => request('/auth/me', { method: 'DELETE' }),
}
