import Appointment from '../models/Appointment.js'
import Reminder from '../models/Reminder.js'
import { addDays, todayStr } from '../utils/dates.js'
import { formatDate } from '../utils/format.js'
import { notifyCustomer, notifyStaff } from '../services/notificationService.js'

const EVERY_30_MIN = 30 * 60 * 1000

// Har 30 minute me chalta hai:
// 1) kal/aaj ke appointments ki "reminder" notification customer ko
// 2) jin follow-ups ki date aa gayi unki notification customer + staff ko
const runReminderJob = async () => {
  const today = todayStr()
  const tomorrow = addDays(today, 1)

  // 1) Appointment reminders — reminderNotifiedAt set karke atomic, taaki dobara na jaaye
  const upcoming = await Appointment.find({
    status: 'scheduled',
    date: { $in: [today, tomorrow] },
    reminderNotifiedAt: null,
  }).lean()

  for (const appt of upcoming) {
    const claimed = await Appointment.updateOne(
      { _id: appt._id, reminderNotifiedAt: null },
      { reminderNotifiedAt: new Date() },
    )
    if (!claimed.modifiedCount) continue
    const when = appt.date === today ? 'today' : 'tomorrow'
    await notifyCustomer(appt.customer, {
      type: 'reminder',
      title: `Your appointment is ${when}`,
      message: `${appt.therapyName} on ${formatDate(appt.date)} at ${appt.slot}. Please arrive 10 minutes early.`,
      link: '/appointments',
    })
  }

  // 2) Follow-up reminders jinki date aa gayi
  const due = await Reminder.find({ status: 'scheduled', dueDate: { $lte: today }, notifiedAt: null })
    .populate('customer', 'name customerId')
    .lean()

  for (const reminder of due) {
    const claimed = await Reminder.updateOne({ _id: reminder._id, notifiedAt: null }, { notifiedAt: new Date() })
    if (!claimed.modifiedCount || !reminder.customer) continue
    await notifyCustomer(reminder.customer._id, {
      type: 'reminder',
      title: 'Time for your follow-up',
      message: reminder.message,
      link: '/therapies',
    })
  }
  if (due.length) {
    await notifyStaff({
      type: 'reminder',
      title: `${due.length} follow-up${due.length > 1 ? 's' : ''} due`,
      message: 'Send WhatsApp/SMS follow-ups and mark them as sent.',
      link: '/admin/follow-ups',
    })
  }
}

export const startReminderJob = () => {
  const run = () => runReminderJob().catch((err) => console.error('Reminder job failed:', err.message))
  run()
  setInterval(run, EVERY_30_MIN)
}
