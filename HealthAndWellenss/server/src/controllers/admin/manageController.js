import Reminder from '../../models/Reminder.js'
import Feedback from '../../models/Feedback.js'
import Offer from '../../models/Offer.js'
import Customer from '../../models/Customer.js'
import { httpError, pick } from '../../utils/httpError.js'
import { isValidDateStr, todayStr } from '../../utils/dates.js'
import { getSettings, updateSettings } from '../../services/settingsService.js'
import { notifyCustomer } from '../../services/notificationService.js'
import { SLOT_REGEX } from '../../config/constants.js'
import { slotToMinutes } from '../../utils/dates.js'

// Admin panel ke chhote modules: follow-ups, feedback, offers, settings

// ===== Follow-ups & reminders =====

// GET /api/admin/reminders?status=scheduled|sent|cancelled&due=today
export const listReminders = async (req, res) => {
  const filter = { status: req.query.status || 'scheduled' }
  if (req.query.due === 'today') filter.dueDate = { $lte: todayStr() }
  const data = await Reminder.find(filter)
    .sort(filter.status === 'scheduled' ? { dueDate: 1 } : { sentAt: -1 })
    .limit(200)
    .populate('customer', 'name customerId mobile consent')
    .lean()
  res.json({ success: true, data })
}

export const createReminder = async (req, res) => {
  const { customerId, dueDate, message, channel } = req.body || {}
  if (!isValidDateStr(dueDate) || dueDate < todayStr()) throw httpError(400, 'Please select a valid future date')
  const customer = await Customer.findById(customerId)
  if (!customer) throw httpError(404, 'Please select a customer')
  const reminder = await Reminder.create({ customer: customer._id, dueDate, message, channel, type: 'custom' })
  res.status(201).json({ success: true, message: 'Reminder scheduled', data: reminder })
}

// PATCH /api/admin/reminders/:id — "sent" mark karna (WhatsApp/call ke baad), cancel, ya date/message edit
export const updateReminder = async (req, res) => {
  const data = pick(req.body, ['status', 'dueDate', 'message', 'channel'])
  if (data.dueDate && !isValidDateStr(data.dueDate)) throw httpError(400, 'Please select a valid date')
  if (data.status === 'sent') data.sentAt = new Date()

  const reminder = await Reminder.findByIdAndUpdate(req.params.id, data, { returnDocument: 'after', runValidators: true })
  if (!reminder) throw httpError(404, 'Reminder not found')
  if (data.status === 'sent' && !reminder.notifiedAt) {
    notifyCustomer(reminder.customer, { type: 'reminder', title: 'Follow-up reminder', message: reminder.message, link: '/therapies' })
  }
  res.json({ success: true, message: data.status === 'sent' ? 'Marked as sent' : 'Reminder updated', data: reminder })
}

// ===== Feedback =====

// GET /api/admin/feedback?rating=5 — list + average + 1-5 star distribution
export const listFeedback = async (req, res) => {
  const filter = req.query.rating ? { rating: Number(req.query.rating) } : {}
  const [items, distribution] = await Promise.all([
    Feedback.find(filter).sort({ createdAt: -1 }).limit(200).populate('customer', 'name customerId').lean(),
    Feedback.aggregate([{ $group: { _id: '$rating', count: { $sum: 1 } } }]),
  ])
  const counts = Object.fromEntries(distribution.map((d) => [d._id, d.count]))
  const total = distribution.reduce((s, d) => s + d.count, 0)
  const avg = total ? distribution.reduce((s, d) => s + d._id * d.count, 0) / total : 0
  res.json({
    success: true,
    data: { items, total, avg: Number(avg.toFixed(1)), distribution: [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: counts[r] || 0 })) },
  })
}

export const updateFeedback = async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(req.params.id, pick(req.body, ['isPublic']), { returnDocument: 'after' })
  if (!feedback) throw httpError(404, 'Feedback not found')
  res.json({ success: true, message: feedback.isPublic ? 'Shown as testimonial' : 'Hidden from testimonials', data: feedback })
}

// ===== Offers =====

const OFFER_FIELDS = ['title', 'description', 'discountPercent', 'validTill', 'minTier', 'oncePerCustomer', 'isActive']

const checkValidTill = (validTill) => {
  if (validTill !== undefined && !isValidDateStr(validTill)) throw httpError(400, 'Please select a valid end date')
}

export const listOffers = async (req, res) => {
  const data = await Offer.find().sort({ isActive: -1, validTill: -1 }).lean()
  res.json({ success: true, data })
}

export const createOffer = async (req, res) => {
  const data = pick(req.body, OFFER_FIELDS)
  checkValidTill(data.validTill)
  const offer = await Offer.create(data)

  // Promotional consent wale customers ko naye offer ki notification
  if (offer.isActive) {
    const customers = await Customer.find({ 'consent.promotional': true, isActive: true }).select('_id').lean()
    customers.forEach((c) =>
      notifyCustomer(c._id, {
        type: 'offer',
        title: `New offer: ${offer.discountPercent}% off`,
        message: `${offer.title}. Valid till ${offer.validTill}.`,
        link: '/loyalty',
      }),
    )
  }
  res.status(201).json({ success: true, message: 'Offer created', data: offer })
}

export const updateOffer = async (req, res) => {
  const data = pick(req.body, OFFER_FIELDS)
  checkValidTill(data.validTill)
  const offer = await Offer.findByIdAndUpdate(req.params.id, data, { returnDocument: 'after', runValidators: true })
  if (!offer) throw httpError(404, 'Offer not found')
  res.json({ success: true, message: 'Offer updated', data: offer })
}

export const deleteOffer = async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id)
  if (!offer) throw httpError(404, 'Offer not found')
  res.json({ success: true, message: 'Offer deleted' })
}

// ===== Centre settings =====

const SETTING_FIELDS = [
  'centreName', 'phone', 'whatsapp', 'email', 'address', 'openingHours', 'timeSlots', 'slotCapacity',
  'bookingWindowDays', 'pointsPerVisit', 'pointValue', 'followUpAfterDays', 'silverVisits', 'goldVisits',
]

export const getAllSettings = async (req, res) => {
  res.json({ success: true, data: await getSettings() })
}

export const saveSettings = async (req, res) => {
  const data = pick(req.body, SETTING_FIELDS)
  if (data.timeSlots) {
    // Slots saaf karo: trim, duplicate hatao, time ke order me lagao
    const slots = [...new Set(data.timeSlots.map((s) => String(s).trim().toUpperCase()))]
    const bad = slots.find((s) => !SLOT_REGEX.test(s))
    if (bad) throw httpError(400, `"${bad}" is not a valid time. Use the format 10:00 AM`)
    data.timeSlots = slots.sort((a, b) => slotToMinutes(a) - slotToMinutes(b))
  }
  const current = await getSettings()
  const silver = data.silverVisits ?? current.silverVisits
  const gold = data.goldVisits ?? current.goldVisits
  if (Number(gold) <= Number(silver)) throw httpError(400, 'Gold visits must be more than Silver visits')

  res.json({ success: true, message: 'Settings saved', data: await updateSettings(data) })
}
