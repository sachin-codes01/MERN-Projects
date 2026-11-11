import Customer from '../../models/Customer.js'
import Appointment from '../../models/Appointment.js'
import Feedback from '../../models/Feedback.js'
import Reminder from '../../models/Reminder.js'
import { escapeRegex, httpError } from '../../utils/httpError.js'
import { tierFor } from '../../services/settingsService.js'

// Naam, mobile ya customer ID — kisi se bhi search
const searchFilter = (q) => {
  const text = String(q || '').trim()
  if (!text) return {}
  const regex = new RegExp(escapeRegex(text), 'i')
  return { $or: [{ name: regex }, { mobile: regex }, { customerId: regex }, { email: regex }] }
}

// GET /api/admin/customers?search=&page=1&limit=20&sort=recent|visits|name
export const listCustomers = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const sort = { visits: { visitsCount: -1 }, name: { name: 1 } }[req.query.sort] || { createdAt: -1 }
  const filter = searchFilter(req.query.search)

  const [items, total] = await Promise.all([
    Customer.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Customer.countDocuments(filter),
  ])
  const withTier = await Promise.all(items.map(async (c) => ({ ...c, tier: await tierFor(c.visitsCount) })))
  res.json({ success: true, data: { items: withTier, total, page, pages: Math.ceil(total / limit) || 1 } })
}

// Customer + uski saari appointments, ratings aur reminders
const fullProfile = async (customer) => {
  const [appointments, feedback, reminders] = await Promise.all([
    Appointment.find({ customer: customer._id }).sort({ date: -1, slotOrder: -1 }).lean(),
    Feedback.find({ customer: customer._id }).sort({ createdAt: -1 }).lean(),
    Reminder.find({ customer: customer._id }).sort({ dueDate: -1 }).lean(),
  ])
  const c = customer.toObject()
  return { ...c, tier: await tierFor(c.visitsCount), appointments, feedback, reminders }
}

// GET /api/admin/customers/:id
export const getCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id)
  if (!customer) throw httpError(404, 'Customer not found')
  res.json({ success: true, data: await fullProfile(customer) })
}

// GET /api/admin/customers/code/:customerId — QR scan ke baad staff yahan aata hai
export const getCustomerByCode = async (req, res) => {
  const customer = await Customer.findOne({ customerId: req.params.customerId.toUpperCase() })
  if (!customer) throw httpError(404, 'No customer found with this ID')
  res.json({ success: true, data: await fullProfile(customer) })
}

// PATCH /api/admin/customers/:id — staff notes, account active, wellness info update
export const updateCustomer = async (req, res) => {
  const { staffNotes, isActive, name, address, email, wellness } = req.body || {}
  const customer = await Customer.findById(req.params.id)
  if (!customer) throw httpError(404, 'Customer not found')

  if (staffNotes !== undefined) customer.staffNotes = staffNotes
  if (isActive !== undefined) {
    if (req.staff.role !== 'admin') throw httpError(403, 'Only admins can activate or deactivate customers')
    customer.isActive = Boolean(isActive)
  }
  if (name !== undefined) customer.name = name
  if (address !== undefined) customer.address = address
  if (email !== undefined) customer.email = email
  if (wellness) customer.wellness = { ...customer.wellness.toObject(), ...wellness }

  await customer.save()
  res.json({ success: true, message: 'Customer updated', data: await fullProfile(customer) })
}
