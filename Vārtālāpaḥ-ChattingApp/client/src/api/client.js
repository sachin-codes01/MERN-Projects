// ==========================================================
// API CLIENT
//
// Poore project me backend se baat karne ka SIRF yahi rasta hai.
// Fetch ka code baar baar likhne ki zarurat nahi padti, aur agar
// kabhi backend ka address ya error handling badalni ho to
// sirf yahi ek file badalni hogi
// ==========================================================

// Backend ka address - .env se aata hai
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ==========================================================
// Normal JSON request (GET, POST, PUT, DELETE)
//
// credentials: 'include' sabse important hai - isse login wali
// cookie apne aap har request ke saath jati hai. Iske bina
// backend har baar "Please log in first" bhejega
// ==========================================================
export const api = async (path, { method = 'GET', body } = {}) => {
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      method,
      credentials: 'include', // cookie bhejne ke liye zaroori
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await res.json().catch(() => ({}))

    // Server ne error status bheja to error throw karte hain
    if (!res.ok) throw new Error(data.message || 'Kuch galat ho gaya')

    return data
  } catch (err) {
    // Server hi band ho to fetch fail hota hai
    if (err.name === 'TypeError') throw new Error('Server se connection nahi ho pa raha')
    throw err
  }
}

// ==========================================================
// FILE UPLOAD
// Upar wala api() JSON bhejta hai, lekin file ke liye FormData chahiye
//
// FormData bhejte waqt Content-Type header KHUD SET NAHI karna -
// browser apne aap sahi boundary ke saath laga deta hai
// ==========================================================
export const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Upload fail ho gaya')

  return data
}
