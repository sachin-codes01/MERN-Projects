import { qs, request } from './client.js'

// Saari API calls naam se — page me sirf `customerApi.book(...)` jaisa likhna padta hai

const post = (path, body, auth) => request(path, { method: 'POST', body, auth })
const patch = (path, body, auth) => request(path, { method: 'PATCH', body, auth })
const put = (path, body, auth) => request(path, { method: 'PUT', body, auth })
const del = (path, auth) => request(path, { method: 'DELETE', auth })

// ===== Bina login =====
export const publicApi = {
  settings: () => request('/settings/public'),
  therapies: () => request('/therapies'),
  therapy: (slug) => request(`/therapies/${encodeURIComponent(slug)}`),
  slots: (date) => request(`/appointments/slots${qs({ date })}`),
  scan: (customerId) => request(`/customers/scan/${encodeURIComponent(customerId)}`),
}

export const authApi = {
  sendOtp: (mobile, purpose) => post('/auth/otp/send', { mobile, purpose }),
  verifyOtp: (mobile, purpose, otp) => post('/auth/otp/verify', { mobile, purpose, otp }),
  register: (body) => post('/customers/register', body),
}

// ===== Customer (login ke baad) =====
const C = 'customer'
export const customerApi = {
  me: () => request('/customers/me', { auth: C }),
  updateMe: (body) => patch('/customers/me', body, C),
  book: (body) => post('/appointments', body, C),
  appointments: (scope) => request(`/appointments/mine${qs({ scope })}`, { auth: C }),
  appointment: (id) => request(`/appointments/${id}`, { auth: C }),
  cancel: (id) => patch(`/appointments/${id}/cancel`, {}, C),
  reminders: () => request('/reminders/mine', { auth: C }),
  feedback: (body) => post('/feedback', body, C),
  loyalty: () => request('/offers/mine', { auth: C }),
  notifications: () => request('/notifications', { auth: C }),
  readNotifications: (id) => patch('/notifications/read', { id }, C),
}

// ===== Staff / Admin panel =====
const S = 'staff'
export const staffApi = {
  uploadTherapyImage: file => request('/admin/therapy-images', { method: 'POST', rawBody: file, auth: S }),
  login: (email, password) => post('/staff/login', { email, password }),
  me: () => request('/admin/me', { auth: S }),
  changePassword: (body) => patch('/admin/me/password', body, S),
  notifications: () => request('/admin/notifications', { auth: S }),
  readNotifications: (id) => patch('/admin/notifications/read', { id }, S),

  stats: () => request('/admin/stats', { auth: S }),
  reports: (params) => request(`/admin/reports${qs(params)}`, { auth: S }),

  customers: (params) => request(`/admin/customers${qs(params)}`, { auth: S }),
  customer: (id) => request(`/admin/customers/${id}`, { auth: S }),
  customerByCode: (code) => request(`/admin/customers/code/${encodeURIComponent(code)}`, { auth: S }),
  updateCustomer: (id, body) => patch(`/admin/customers/${id}`, body, S),

  appointments: (params) => request(`/admin/appointments${qs(params)}`, { auth: S }),
  book: (body) => post('/admin/appointments', body, S),
  updateAppointment: (id, body) => patch(`/admin/appointments/${id}`, body, S),

  reminders: (params) => request(`/admin/reminders${qs(params)}`, { auth: S }),
  createReminder: (body) => post('/admin/reminders', body, S),
  updateReminder: (id, body) => patch(`/admin/reminders/${id}`, body, S),

  feedback: (params) => request(`/admin/feedback${qs(params)}`, { auth: S }),
  updateFeedback: (id, body) => patch(`/admin/feedback/${id}`, body, S),

  therapies: () => request('/admin/therapies', { auth: S }),
  createTherapy: (body) => post('/admin/therapies', body, S),
  updateTherapy: (id, body) => put(`/admin/therapies/${id}`, body, S),
  deleteTherapy: (id) => del(`/admin/therapies/${id}`, S),

  offers: () => request('/admin/offers', { auth: S }),
  createOffer: (body) => post('/admin/offers', body, S),
  updateOffer: (id, body) => put(`/admin/offers/${id}`, body, S),
  deleteOffer: (id) => del(`/admin/offers/${id}`, S),

  settings: () => request('/admin/settings', { auth: S }),
  saveSettings: (body) => put('/admin/settings', body, S),

  staff: () => request('/admin/staff', { auth: S }),
  createStaff: (body) => post('/admin/staff', body, S),
  updateStaff: (id, body) => patch(`/admin/staff/${id}`, body, S),
}
