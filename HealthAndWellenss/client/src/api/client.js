// Backend se baat karne ka ek hi rasta — token lagana, error message nikaalna sab yahin
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const TOKEN_KEYS = { customer: 'srs_customer_token', staff: 'srs_staff_token' }

// localStorage kabhi kabhi (private mode) error deta hai — isliye try/catch
export const getToken = (role) => {
  try {
    return localStorage.getItem(TOKEN_KEYS[role])
  } catch {
    return null
  }
}

export const setToken = (role, token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEYS[role], token)
    else localStorage.removeItem(TOKEN_KEYS[role])
  } catch {
    // storage band hai to bas memory me login rahega
  }
}

const apiError = (message, status, errors) => Object.assign(new Error(message), { status, errors })

// auth: 'customer' | 'staff' — kis role ka token bhejna hai
export const request = async (path, { method = 'GET', body, rawBody, auth } = {}) => {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (rawBody) headers['Content-Type'] = rawBody.type
  const token = auth && getToken(auth)
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: rawBody || (body === undefined ? undefined : JSON.stringify(body)),
    })
  } catch {
    throw apiError('Unable to reach the server. Please check your internet connection.', 0)
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // Token expire → logout karwa do (AuthContext ye event sunta hai)
    if (res.status === 401 && auth && token) {
      setToken(auth, null)
      window.dispatchEvent(new CustomEvent('auth:expired', { detail: auth }))
    }
    throw apiError(data.message || 'Something went wrong. Please try again.', res.status, data.errors)
  }
  return data
}

// { page: 2, search: '' } → "?page=2" (khaali values hata ke)
export const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return entries.length ? `?${new URLSearchParams(entries)}` : ''
}

export const mediaUrl = (url) => url?.startsWith('/api/media/') ? BASE_URL.replace(/\/$/, '') + '/media/' + url.slice('/api/media/'.length) : url
