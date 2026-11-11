import bcrypt from 'bcryptjs'
import Staff from '../models/Staff.js'
import { httpError } from '../utils/httpError.js'
import { signStaffToken } from '../utils/token.js'

const MIN_PASSWORD = 8

const checkPassword = (password) => {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    throw httpError(400, `Password must be at least ${MIN_PASSWORD} characters`)
  }
}

const toView = (s) => ({ _id: s._id, name: s.name, email: s.email, role: s.role, isActive: s.isActive, lastLoginAt: s.lastLoginAt, createdAt: s.createdAt })

// POST /api/staff/login
export const login = async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) throw httpError(400, 'Please enter your email and password')

  const staff = await Staff.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash')
  // Email galat ho ya password — ek hi message, taaki koi email guess na kar sake
  if (!staff || !(await bcrypt.compare(password, staff.passwordHash))) {
    throw httpError(401, 'Incorrect email or password')
  }
  if (!staff.isActive) throw httpError(403, 'Your account has been deactivated. Please contact the admin.')

  staff.lastLoginAt = new Date()
  await staff.save()
  res.json({ success: true, message: `Welcome, ${staff.name.split(' ')[0]}!`, token: signStaffToken(staff), staff: toView(staff) })
}

// GET /api/staff/me
export const getMe = (req, res) => {
  res.json({ success: true, data: toView(req.staff) })
}

// PATCH /api/staff/me/password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  const staff = await Staff.findById(req.staff._id).select('+passwordHash')
  if (!(await bcrypt.compare(currentPassword || '', staff.passwordHash))) {
    throw httpError(400, 'Current password is incorrect')
  }
  checkPassword(newPassword)
  staff.passwordHash = await bcrypt.hash(newPassword, 10)
  await staff.save()
  res.json({ success: true, message: 'Password changed successfully' })
}

// ===== Admin only: staff manage karna =====

export const listStaff = async (req, res) => {
  const staff = await Staff.find().sort({ createdAt: 1 })
  res.json({ success: true, data: staff.map(toView) })
}

export const createStaff = async (req, res) => {
  const { name, email, password, role } = req.body || {}
  checkPassword(password)
  const staff = await Staff.create({
    name,
    email,
    role: role === 'admin' ? 'admin' : 'staff',
    passwordHash: await bcrypt.hash(password, 10),
  })
  res.status(201).json({ success: true, message: 'Staff member added', data: toView(staff) })
}

// Role badalna, account band/chalu karna, ya naya password set karna
export const updateStaff = async (req, res) => {
  const { role, isActive, password, name } = req.body || {}
  const isSelf = String(req.params.id) === String(req.staff._id)
  if (isSelf && (isActive === false || role === 'staff')) {
    throw httpError(400, 'You cannot deactivate or demote your own account')
  }

  const staff = await Staff.findById(req.params.id)
  if (!staff) throw httpError(404, 'Staff member not found')
  if (name !== undefined) staff.name = name
  if (role !== undefined) staff.role = role === 'admin' ? 'admin' : 'staff'
  if (isActive !== undefined) staff.isActive = Boolean(isActive)
  if (password) {
    checkPassword(password)
    staff.passwordHash = await bcrypt.hash(password, 10)
  }
  await staff.save()
  res.json({ success: true, message: 'Staff member updated', data: toView(staff) })
}
