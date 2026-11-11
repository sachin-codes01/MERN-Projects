import Appointment from '../../models/Appointment.js'
import Customer from '../../models/Customer.js'
import Reminder from '../../models/Reminder.js'
import { httpError } from '../../utils/httpError.js'
import { addDays, isValidDateStr, todayStr } from '../../utils/dates.js'
import { bookAppointment } from '../../services/bookingService.js'
import { getSettings } from '../../services/settingsService.js'
import { notifyCustomer } from '../../services/notificationService.js'
import { formatDate } from '../../utils/format.js'

const populateCustomer = (query) => query.populate('customer', 'name customerId mobile visitsCount')

// GET /api/admin/appointments?from=&to=&status= (default: aaj)
export const listAppointments = async (req, res) => {
  const from = req.query.from || req.query.date || todayStr()
  const to = req.query.to || req.query.date || from
  if (!isValidDateStr(from) || !isValidDateStr(to) || from > to) throw httpError(400, 'Please select a valid date')
  if (addDays(from, 62) < to) throw httpError(400, 'Date range cannot be longer than 2 months')

  const filter = { date: { $gte: from, $lte: to } }
  if (req.query.status) filter.status = req.query.status

  const data = await populateCustomer(Appointment.find(filter).sort({ date: 1, slotOrder: 1 })).lean()
  res.json({ success: true, data })
}

// POST /api/admin/appointments — staff kisi customer ke liye booking kare (walk-in / phone call)
export const createAppointmentForCustomer = async (req, res) => {
  const { customerId, therapyId, date, slot, notes, offerId } = req.body || {}
  const customer = await Customer.findById(customerId)
  if (!customer) throw httpError(404, 'Please select a customer')

  const appointment = await bookAppointment({ customer, therapyId, date, slot, notes, offerId, bookedBy: 'staff' })
  res.status(201).json({
    success: true,
    message: 'Appointment booked',
    data: await populateCustomer(Appointment.findById(appointment._id)).lean(),
  })
}

// Visit complete: points + visit count badhao, aur follow-up reminder banao
const onCompleted = async (appointment) => {
  const settings = await getSettings()
  const customer = await Customer.findByIdAndUpdate(
    appointment.customer,
    { $inc: { visitsCount: 1, loyaltyPoints: settings.pointsPerVisit }, lastVisitAt: new Date() },
    { returnDocument: 'after' },
  )

  notifyCustomer(customer._id, {
    type: 'visit',
    title: 'Thank you for visiting!',
    message: `Hope you enjoyed your ${appointment.therapyName}. You earned ${settings.pointsPerVisit} loyalty points. Tap to rate your visit.`,
    link: `/rate/${appointment._id}`,
  })

  // Follow-up reminder sirf unko jinhone consent diya hai
  if (customer.consent.followUp) {
    const dueDate = addDays(appointment.date, settings.followUpAfterDays)
    await Reminder.create({
      customer: customer._id,
      appointment: appointment._id,
      dueDate,
      message: `Hi ${customer.name.split(' ')[0]}, it has been ${settings.followUpAfterDays} days since your ${appointment.therapyName}. How are you feeling now? Has your condition improved? Please reply to let the centre know, or contact us if you need support.`,
    })
  }
}

// PATCH /api/admin/appointments/:id — status badalna (complete / cancel / no-show), therapist, notes
export const updateAppointment = async (req, res) => {
  const { status, therapist, notes } = req.body || {}
  const extra = {}
  if (therapist !== undefined) extra.therapist = therapist
  if (notes !== undefined) extra.notes = notes

  let appointment
  if (status && status !== 'scheduled') {
    if (!['completed', 'cancelled', 'no-show'].includes(status)) throw httpError(400, 'Invalid status')
    const current = await Appointment.findById(req.params.id)
    if (!current) throw httpError(404, 'Appointment not found')
    if (status === 'completed' && current.date > todayStr()) {
      throw httpError(400, 'A future appointment cannot be marked as completed')
    }

    // Sirf "scheduled" se hi status badle — double click pe points do baar nahi milenge
    const stamp = status === 'completed' ? { completedAt: new Date() } : status === 'cancelled' ? { cancelledAt: new Date(), cancelledBy: 'staff' } : {}
    appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, status: 'scheduled' },
      { status, ...stamp, ...extra },
      { returnDocument: 'after' },
    )
    if (!appointment) throw httpError(409, 'This appointment has already been updated. Please refresh.')

    if (status === 'completed') await onCompleted(appointment)
    if (status === 'cancelled') {
      notifyCustomer(appointment.customer, {
        type: 'cancellation',
        title: 'Appointment cancelled',
        message: `Your ${appointment.therapyName} on ${formatDate(appointment.date)} at ${appointment.slot} was cancelled by the centre. Please book another slot or call us.`,
        link: '/therapies',
      })
    }
  } else {
    appointment = await Appointment.findByIdAndUpdate(req.params.id, extra, { returnDocument: 'after', runValidators: true })
    if (!appointment) throw httpError(404, 'Appointment not found')
  }

  res.json({
    success: true,
    message: status && status !== 'scheduled' ? `Marked as ${status}` : 'Appointment updated',
    data: await populateCustomer(Appointment.findById(appointment._id)).lean(),
  })
}
