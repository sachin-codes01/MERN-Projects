import Appointment from '../models/Appointment.js'
import Feedback from '../models/Feedback.js'
import Reminder from '../models/Reminder.js'
import Notification from '../models/Notification.js'
import { httpError } from '../utils/httpError.js'
import { todayStr } from '../utils/dates.js'
import { getEligibleOffers } from '../services/offerService.js'
import { getSettings, publicSettings } from '../services/settingsService.js'
import { getTier } from '../config/constants.js'
import { notifyStaff } from '../services/notificationService.js'

// Customer side ke chhote features: reminders, rating, loyalty, notifications, public settings

// GET /api/settings/public — centre ka phone, address, slots (website footer/contact ke liye)
export const getPublicSettings = async (req, res) => {
  res.json({ success: true, data: publicSettings(await getSettings()) })
}

// GET /api/reminders/mine — agla follow-up + purane reminders
export const myReminders = async (req, res) => {
  const customer = req.customer._id
  const [next, past] = await Promise.all([
    Reminder.findOne({ customer, status: 'scheduled', dueDate: { $gte: todayStr() } }).sort({ dueDate: 1 }).lean(),
    Reminder.find({ customer, status: 'sent' }).sort({ sentAt: -1 }).limit(20).lean(),
  ])
  res.json({ success: true, data: { next, past } })
}

// POST /api/feedback — sirf apni completed visit ko, ek hi baar
export const createFeedback = async (req, res) => {
  const { appointmentId, rating, comment } = req.body || {}
  const appointment = await Appointment.findOne({ _id: appointmentId, customer: req.customer._id })
  if (!appointment) throw httpError(404, 'Visit not found')
  if (appointment.status !== 'completed') throw httpError(400, 'You can rate a visit only after it is completed')

  try {
    const feedback = await Feedback.create({
      customer: req.customer._id,
      appointment: appointment._id,
      therapyName: appointment.therapyName,
      rating: Number(rating),
      comment,
    })
    notifyStaff({
      type: 'feedback',
      title: `New ${feedback.rating}★ rating`,
      message: `${req.customer.name} rated ${appointment.therapyName}${comment ? `: "${comment.slice(0, 80)}"` : ''}`,
      link: '/admin/feedback',
    })
    res.status(201).json({ success: true, message: 'Thank you for your feedback!', data: feedback })
  } catch (err) {
    if (err.code === 11000) throw httpError(409, 'You have already rated this visit')
    throw err
  }
}

// GET /api/offers/mine — loyalty status + eligible offers
export const myLoyalty = async (req, res) => {
  const c = req.customer
  const settings = await getSettings()
  const tier = getTier(c.visitsCount, settings)
  const nextTier =
    tier === 'Bronze'
      ? { name: 'Silver', visitsNeeded: settings.silverVisits - c.visitsCount, target: settings.silverVisits }
      : tier === 'Silver'
        ? { name: 'Gold', visitsNeeded: settings.goldVisits - c.visitsCount, target: settings.goldVisits }
        : null

  res.json({
    success: true,
    data: {
      tier,
      visits: c.visitsCount,
      points: c.loyaltyPoints,
      pointValue: settings.pointValue,
      pointsPerVisit: settings.pointsPerVisit,
      nextTier,
      offers: await getEligibleOffers(c),
    },
  })
}

// ===== Notifications (bell icon) — customer aur staff dono ke liye =====

const notificationFilter = (req) =>
  req.customer ? { audience: 'customer', customer: req.customer._id } : { audience: 'staff' }

// Staff me har staff ka "padha" alag hota hai (readBy), customer me simple isRead
const withReadFlag = (req, list) =>
  req.customer ? list : list.map(({ readBy, ...n }) => ({ ...n, isRead: readBy.some((id) => String(id) === String(req.staff._id)) }))

export const listNotifications = async (req, res) => {
  const filter = notificationFilter(req)
  const unreadFilter = req.customer ? { ...filter, isRead: false } : { ...filter, readBy: { $ne: req.staff._id } }
  const [list, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments(unreadFilter),
  ])
  res.json({ success: true, data: { items: withReadFlag(req, list), unread } })
}

// PATCH /notifications/read — body { id } ek ko, ya bina id sabko padha hua
export const markNotificationsRead = async (req, res) => {
  const filter = notificationFilter(req)
  if (req.body?.id) filter._id = req.body.id
  const update = req.customer ? { isRead: true } : { $addToSet: { readBy: req.staff._id } }
  await Notification.updateMany(filter, update)
  res.json({ success: true })
}
