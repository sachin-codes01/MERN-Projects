import Customer from '../models/Customer.js'
import Staff from '../models/Staff.js'
import { httpError } from '../utils/httpError.js'
import { verifyToken } from '../utils/token.js'

// "Authorization: Bearer <token>" header se token nikaalta hai
const readToken = (req, role) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw httpError(401, 'Please log in to continue')
  const payload = verifyToken(token)
  if (payload.role !== role) throw httpError(401, 'Please log in to continue')
  return payload
}

// Sirf logged-in customer aage ja sakta hai — req.customer me poora customer milta hai
export const protectCustomer = async (req, res, next) => {
  const { id } = readToken(req, 'customer')
  const customer = await Customer.findById(id)
  if (!customer || !customer.isActive) throw httpError(401, 'Your session has ended. Please log in again.')
  req.customer = customer
  next()
}

// Sirf staff/admin — req.staff me staff user
export const protectStaff = async (req, res, next) => {
  const { id } = readToken(req, 'staff')
  const staff = await Staff.findById(id)
  if (!staff || !staff.isActive) throw httpError(401, 'Your session has ended. Please log in again.')
  req.staff = staff
  next()
}

// Settings, staff, offers jaise kaam sirf admin kar sakta hai
export const adminOnly = (req, res, next) => {
  if (req.staff?.role !== 'admin') throw httpError(403, 'Only admins can do this')
  next()
}
