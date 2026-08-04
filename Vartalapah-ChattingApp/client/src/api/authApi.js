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

  // Naya account - username + email + password. verificationToken =
  // email par aaye 6-digit code ko verify karne par mila token (dekho
  // EmailOtpStep.jsx) - iske bina backend account banata hi nahi.
  // Success hote hi login bhi kar deta hai (JWT cookie)
  register: (username, email, password, confirmPassword, verificationToken) =>
    request('/auth/register', { method: 'POST', body: { username, email, password, confirmPassword, verificationToken } }),

  // Google se pehli baar aaya user - apna application password banata hai
  setPassword: (password, confirmPassword) =>
    request('/auth/set-password', { method: 'POST', body: { password, confirmPassword } }),

  // "Forgot password" ka STEP 1 - email se check karte hain account
  // hai ya nahi (code bhejne se pehle hi saaf message dikha sakein)
  checkEmail: (email) => request('/auth/check-email', { method: 'POST', body: { email } }),

  // ---- EMAIL VERIFICATION (OTP) ----
  // Dono flows yahi do routes use karte hain, bas purpose alag:
  //   'register' -> naya account banate waqt
  //   'reset'    -> password bhool jane par
  //
  // sendOtp email par 6-digit code bhejta hai, verifyOtp use check
  // karke ek short-lived verificationToken deta hai. Wahi token aage
  // register / resetPassword ko jata hai
  sendOtp: (email, purpose) =>
    request('/auth/send-otp', { method: 'POST', body: { email, purpose } }),

  verifyOtp: (email, code, purpose) =>
    request('/auth/verify-otp', { method: 'POST', body: { email, code, purpose } }),

  // "Forgot password" - email verify karke naya password banate hain
  resetPassword: (verificationToken, password, confirmPassword) =>
    request('/auth/reset-password', { method: 'POST', body: { verificationToken, password, confirmPassword } }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  updateProfile: (updates) => request('/auth/me', { method: 'PUT', body: updates }),

  // Soft delete - user "deleted" mark hota hai lekin uske bheje hue
  // messages saamne wale ki chat me bane rehte hain
  deleteAccount: () => request('/auth/me', { method: 'DELETE' }),
}
