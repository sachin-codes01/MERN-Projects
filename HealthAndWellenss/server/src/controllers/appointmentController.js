import Appointment from '../models/Appointment.js'
import Feedback from '../models/Feedback.js'
import { httpError } from '../utils/httpError.js'
import { nowMinutes, todayStr } from '../utils/dates.js'
import { bookAppointment, getSlotAvailability } from '../services/bookingService.js'
import { notifyStaff } from '../services/notificationService.js'
import { formatDate } from '../utils/format.js'

// GET /api/appointments/slots?date=2025-10-16 — public, booking page pe slots dikhane ke liye
export const getSlots = async (req, res) => {
  const slots = await getSlotAvailability(req.query.date)
  res.json({ success: true, data: { date: req.query.date, slots } })
}

// POST /api/appointments
export const createAppointment = async (req, res) => {
  const { therapyId, date, slot, offerId, notes } = req.body || {}
  const appointment = await bookAppointment({
    customer: req.customer,
    therapyId,
    date,
    slot,
    offerId,
    notes,
    bookedBy: 'customer',
  })
  res.status(201).json({ success: true, message: 'Appointment booked successfully', data: appointment })
}

// GET /api/appointments/mine?scope=upcoming|history
export const listMyAppointments = async (req, res) => {
  const customer = req.customer._id
  const scope = req.query.scope === 'history' ? 'history' : 'upcoming'

  if (scope === 'upcoming') {
    const data = await Appointment.find({ customer, status: 'scheduled', date: { $gte: todayStr() } })
      .sort({ date: 1, slotOrder: 1 })
      .lean()
    return res.json({ success: true, data })
  }

  // History: complete visits + har visit ki rating (agar di ho)
  const visits = await Appointment.find({ customer, status: 'completed' }).sort({ date: -1, slotOrder: -1 }).lean()
  const feedback = await Feedback.find({ appointment: { $in: visits.map((v) => v._id) } }).lean()
  const ratingMap = Object.fromEntries(feedback.map((f) => [String(f.appointment), f.rating]))
  res.json({
    success: true,
    data: visits.map((v) => ({ ...v, rating: ratingMap[String(v._id)] || null })),
  })
}

// GET /api/appointments/:id
export const getMyAppointment = async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, customer: req.customer._id }).lean()
  if (!appointment) throw httpError(404, 'Appointment not found')
  const feedback = await Feedback.findOne({ appointment: appointment._id }).lean()
  res.json({ success: true, data: { ...appointment, rating: feedback?.rating || null } })
}

// PATCH /api/appointments/:id/cancel — sirf aane wala scheduled appointment, atomic update
export const cancelMyAppointment = async (req, res) => {
  const today = todayStr()
  const existing = await Appointment.findOne({ _id: req.params.id, customer: req.customer._id })
  if (!existing) throw httpError(404, 'Appointment not found')
  if (existing.date === today && existing.slotOrder <= nowMinutes()) {
    throw httpError(400, 'This appointment has already started and cannot be cancelled')
  }

  const appointment = await Appointment.findOneAndUpdate(
    { _id: existing._id, status: 'scheduled', date: { $gte: today } },
    { status: 'cancelled', cancelledAt: new Date(), cancelledBy: 'customer' },
    { returnDocument: 'after' },
  )
  if (!appointment) throw httpError(400, 'This appointment can no longer be cancelled')

  notifyStaff({
    type: 'cancellation',
    title: 'Appointment cancelled',
    message: `${req.customer.name} cancelled ${appointment.therapyName} on ${formatDate(appointment.date)} at ${appointment.slot}`,
    link: `/admin/appointments?date=${appointment.date}`,
  })
  res.json({ success: true, message: 'Appointment cancelled', data: appointment })
}
