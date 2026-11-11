import Appointment from '../models/Appointment.js'
import Therapy from '../models/Therapy.js'
import { httpError } from '../utils/httpError.js'
import { addDays, isValidDateStr, nowMinutes, slotToMinutes, todayStr } from '../utils/dates.js'
import { makeAppointmentId, nextSequence } from '../utils/ids.js'
import { getSettings } from './settingsService.js'
import { getEligibleOffers } from './offerService.js'
import { notifyCustomer, notifyStaff } from './notificationService.js'
import { formatDate } from '../utils/format.js'

// Date + slot valid hai ya nahi (past, booking window ke bahar, ya galat slot)
export const validateDateSlot = (date, slot, settings) => {
  const today = todayStr()
  if (!isValidDateStr(date)) throw httpError(400, 'Please select a valid date')
  if (date < today) throw httpError(400, 'You cannot book an appointment in the past')
  if (date > addDays(today, settings.bookingWindowDays)) {
    throw httpError(400, `Bookings are open only for the next ${settings.bookingWindowDays} days`)
  }
  if (slot !== undefined) {
    if (!settings.timeSlots.includes(slot)) throw httpError(400, 'Please select a valid time slot')
    if (date === today && slotToMinutes(slot) <= nowMinutes()) {
      throw httpError(400, 'This time slot has already passed. Please choose a later time.')
    }
  }
}

// Kisi date ke saare slots aur unme kitni jagah bachi hai
export const getSlotAvailability = async (date) => {
  const settings = await getSettings()
  validateDateSlot(date, undefined, settings)

  const booked = await Appointment.aggregate([
    { $match: { date, status: 'scheduled' } },
    { $group: { _id: '$slot', count: { $sum: 1 } } },
  ])
  const countBySlot = Object.fromEntries(booked.map((b) => [b._id, b.count]))
  const isToday = date === todayStr()
  const now = nowMinutes()

  return [...settings.timeSlots]
    .sort((a, b) => slotToMinutes(a) - slotToMinutes(b))
    .map((time) => {
      const left = Math.max(settings.slotCapacity - (countBySlot[time] || 0), 0)
      const passed = isToday && slotToMinutes(time) <= now
      return { time, left: passed ? 0 : left, available: !passed && left > 0, passed }
    })
}

// Booking ka poora logic ek jagah — customer aur staff dono yahi use karte hain
export const bookAppointment = async ({ customer, therapyId, date, slot, offerId, notes = '', bookedBy }) => {
  const settings = await getSettings()
  validateDateSlot(date, slot, settings)

  const therapy = await Therapy.findOne({ _id: therapyId, isActive: true })
  if (!therapy) throw httpError(404, 'This therapy is not available. Please choose another one.')

  const taken = await Appointment.countDocuments({ date, slot, status: 'scheduled' })
  if (taken >= settings.slotCapacity) {
    throw httpError(409, 'This slot is fully booked. Please choose another time.')
  }

  // Offer lagana ho to check karo ki ye customer use kar sakta hai
  let discount = 0
  let offer = null
  if (offerId) {
    const eligible = await getEligibleOffers(customer)
    offer = eligible.find((o) => String(o._id) === String(offerId))
    if (!offer) throw httpError(400, 'This offer is not available for you')
    discount = Math.round((therapy.price * offer.discountPercent) / 100)
  }

  const appointmentId = makeAppointmentId(await nextSequence('appointment'))
  let appointment
  try {
    appointment = await Appointment.create({
      appointmentId,
      customer: customer._id,
      therapy: therapy._id,
      therapyName: therapy.name,
      duration: `${therapy.durationMin}–${therapy.durationMax} mins`,
      date,
      slot,
      slotOrder: slotToMinutes(slot),
      price: therapy.price,
      discount,
      finalPrice: therapy.price - discount,
      offer: offer?._id,
      notes,
      bookedBy,
    })
  } catch (err) {
    // Unique index: same customer same slot pe pehle se booked (double click)
    if (err.code === 11000) throw httpError(409, 'You already have an appointment at this time.')
    throw err
  }

  // Do log ek saath aakhri jagah book karein to dobara gin ke check — zyada ho gaya to apni booking hata do
  const after = await Appointment.countDocuments({ date, slot, status: 'scheduled' })
  if (after > settings.slotCapacity) {
    await appointment.deleteOne()
    throw httpError(409, 'This slot just got fully booked. Please choose another time.')
  }

  const when = `${formatDate(date)} at ${slot}`
  notifyCustomer(customer._id, {
    type: 'booking',
    title: 'Appointment confirmed',
    message: `${therapy.name} on ${when}. Appointment ID: ${appointmentId}`,
    link: '/appointments',
  })
  notifyStaff({
    type: 'booking',
    title: 'New appointment',
    message: `${customer.name} (${customer.customerId}) booked ${therapy.name} on ${when}`,
    link: `/admin/appointments?date=${date}`,
  })

  return appointment
}
