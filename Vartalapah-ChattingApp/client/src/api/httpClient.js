// ==========================================================
// HTTP CLIENT
//
// Poore project me backend se baat karne ka SIRF yahi rasta hai.
// Iske upar resource-wise files hain (authApi, messageApi, userApi,
// groupApi, uploadApi) - components aur hooks unhi ko bulate hain,
// is file ko seedha koi nahi.
//
// Isse teen fayde hain:
//   1. URL, cookie aur error handling ek hi jagah hai
//   2. Component ko endpoint ka path yaad rakhne ki zarurat nahi
//   3. Kal ko axios par jaana ho ya retry logic jodna ho to sirf
//      yahi ek file badalni padegi
// ==========================================================

// Backend ka address - .env se aata hai
// Vite me sirf VITE_ se shuru hone wali variables frontend tak pahunchti hain
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Server hamesha { success, message } bhejta hai. Fail hone par
// wahi message user ko dikhana hai
const FALLBACK_ERROR = 'Something went wrong. Please try again.'
const NETWORK_ERROR = 'Cannot reach the server. Check your internet connection.'

// ==========================================================
// CSRF TOKEN
//
// Login/register/Google login par backend ek "csrf_token" cookie bhejta
// hai (httpOnly:false - isliye JS ise padh sakti hai, dusri "asli" login
// wali cookie ke ulat). Har GET-se-alag request me isi value ko header
// me dobara bhejna padta hai - server dono ko compare karta hai
// (middleware/csrf.js). Koi doosri website hamari cookie chura ya
// PADH nahi sakti, isliye wahi sahi header kabhi nahi bana payegi
// ==========================================================
const getCsrfToken = () => {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

// ==========================================================
// Normal JSON request (GET, POST, PUT, DELETE)
//
// credentials: 'include' sabse important hai - isse login wali
// httpOnly cookie apne aap har request ke saath jati hai. Iske bina
// backend har baar "Please log in first" bhejega
// ==========================================================
export const request = async (path, { method = 'GET', body } = {}) => {
  let response

  const headers = { 'Content-Type': 'application/json' }

  // GET kuch badalta nahi, isliye CSRF check bhi server par GET ko
  // chhod deta hai - yahan bhi isi hisaab se header lagate hain
  if (method !== 'GET') {
    const csrfToken = getCsrfToken()
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  }

  try {
    response = await fetch(`${API_URL}/api${path}`, {
      method,
      credentials: 'include',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    // fetch sirf tab throw karta hai jab request server tak pahunchi
    // hi na ho (net gaya, server band, CORS block). Server ka bheja
    // hua 4xx/5xx yahan nahi, neeche wale check me pakda jata hai
    throw new Error(NETWORK_ERROR)
  }

  // Server ne khali body bheji ho to .json() phat jata hai
  const data = await response.json().catch(() => ({}))

  if (!response.ok) throw new Error(data.message || FALLBACK_ERROR)

  return data
}

// ==========================================================
// FILE UPLOAD
// Upar wala request() JSON bhejta hai, lekin file ke liye FormData chahiye
//
// FormData bhejte waqt Content-Type header KHUD SET NAHI karna -
// browser apne aap sahi boundary ke saath laga deta hai
// ==========================================================
export const requestUpload = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  let response

  try {
    const csrfToken = getCsrfToken()

    response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      credentials: 'include',
      // Content-Type jaan-boojhkar nahi lagate (upar comment me wajah hai) -
      // sirf CSRF header jodte hain
      headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
      body: formData,
    })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) throw new Error(data.message || 'Upload failed')

  return data
}
