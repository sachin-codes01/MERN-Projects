import Customer from '../../models/Customer.js'
import Appointment from '../../models/Appointment.js'
import Feedback from '../../models/Feedback.js'
import Reminder from '../../models/Reminder.js'
import { TIMEZONE } from '../../config/constants.js'
import { addDays, isValidDateStr, startOfDay, todayStr } from '../../utils/dates.js'
import { httpError } from '../../utils/httpError.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Pichhle 6 mahino ke "YYYY-MM" keys
const lastMonths = (count) => {
  const [y, m] = todayStr().split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1))
    return { key: d.toISOString().slice(0, 7), label: MONTHS[d.getUTCMonth()] }
  })
}

// Therapy wise booking count + percentage
const therapyBreakdown = async (match) => {
  const rows = await Appointment.aggregate([
    { $match: { status: { $ne: 'cancelled' }, ...match } },
    { $group: { _id: '$therapyName', count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$finalPrice', 0] } } } },
    { $sort: { count: -1 } },
  ])
  const total = rows.reduce((sum, r) => sum + r.count, 0) || 1
  return rows.map((r) => ({ name: r._id, count: r.count, revenue: r.revenue, percent: Math.round((r.count / total) * 100) }))
}

// GET /api/admin/stats — dashboard overview cards + charts
export const getStats = async (req, res) => {
  const today = todayStr()
  const months = lastMonths(6)

  const [
    totalCustomers,
    newToday,
    todaysAppointments,
    completedToday,
    visitedCustomers,
    repeatCustomers,
    ratingAgg,
    growthAgg,
    therapyPopularity,
    upcomingToday,
    dueReminders,
  ] = await Promise.all([
    Customer.countDocuments(),
    Customer.countDocuments({ createdAt: { $gte: startOfDay(today) } }),
    Appointment.countDocuments({ date: today, status: { $in: ['scheduled', 'completed'] } }),
    Appointment.countDocuments({ date: today, status: 'completed' }),
    Customer.countDocuments({ visitsCount: { $gte: 1 } }),
    Customer.countDocuments({ visitsCount: { $gte: 2 } }),
    Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
    Customer.aggregate([
      { $match: { createdAt: { $gte: startOfDay(`${months[0].key}-01`) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: TIMEZONE } }, count: { $sum: 1 } } },
    ]),
    therapyBreakdown({}),
    Appointment.find({ date: today, status: 'scheduled' })
      .sort({ slotOrder: 1 })
      .limit(8)
      .populate('customer', 'name customerId mobile')
      .lean(),
    Reminder.countDocuments({ status: 'scheduled', dueDate: { $lte: today } }),
  ])

  const growthMap = Object.fromEntries(growthAgg.map((g) => [g._id, g.count]))

  res.json({
    success: true,
    data: {
      today,
      totalCustomers,
      newToday,
      todaysAppointments,
      completedToday,
      repeatPercent: visitedCustomers ? Math.round((repeatCustomers / visitedCustomers) * 100) : 0,
      avgRating: ratingAgg[0] ? Number(ratingAgg[0].avg.toFixed(1)) : 0,
      ratingCount: ratingAgg[0]?.count || 0,
      customerGrowth: months.map((m) => ({ label: m.label, value: growthMap[m.key] || 0 })),
      therapyPopularity,
      upcomingToday,
      dueReminders,
    },
  })
}

// GET /api/admin/reports?from=2025-10-01&to=2025-10-16
export const getReport = async (req, res) => {
  const to = req.query.to || todayStr()
  const from = req.query.from || addDays(to, -29)
  if (!isValidDateStr(from) || !isValidDateStr(to) || from > to) {
    throw httpError(400, 'Please select a valid date range')
  }
  if (addDays(from, 366) < to) throw httpError(400, 'Date range cannot be longer than one year')

  const range = { date: { $gte: from, $lte: to } }
  const createdRange = { createdAt: { $gte: startOfDay(from), $lt: startOfDay(addDays(to, 1)) } }

  const [statusAgg, daily, byTherapy, newCustomers, newCustomersDaily, ratingAgg] = await Promise.all([
    Appointment.aggregate([
      { $match: range },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$finalPrice' }, discount: { $sum: '$discount' } } },
    ]),
    Appointment.aggregate([
      { $match: { ...range, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$date',
          appointments: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$finalPrice', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    therapyBreakdown(range),
    Customer.countDocuments(createdRange),
    Customer.aggregate([
      { $match: createdRange },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TIMEZONE } }, count: { $sum: 1 } } },
    ]),
    Feedback.aggregate([{ $match: createdRange }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
  ])

  const byStatus = Object.fromEntries(statusAgg.map((s) => [s._id, s]))
  const dailyMap = Object.fromEntries(daily.map((d) => [d._id, d]))
  const customerMap = Object.fromEntries(newCustomersDaily.map((d) => [d._id, d.count]))

  // Har din ki ek row (jis din kuch nahi hua wahan 0) — chart me gap na dikhe
  const series = []
  for (let d = from; d <= to; d = addDays(d, 1)) {
    series.push({
      date: d,
      appointments: dailyMap[d]?.appointments || 0,
      revenue: dailyMap[d]?.revenue || 0,
      newCustomers: customerMap[d] || 0,
    })
  }

  res.json({
    success: true,
    data: {
      from,
      to,
      newCustomers,
      appointments: {
        scheduled: byStatus.scheduled?.count || 0,
        completed: byStatus.completed?.count || 0,
        cancelled: byStatus.cancelled?.count || 0,
        noShow: byStatus['no-show']?.count || 0,
      },
      revenue: byStatus.completed?.revenue || 0,
      discountGiven: byStatus.completed?.discount || 0,
      avgRating: ratingAgg[0] ? Number(ratingAgg[0].avg.toFixed(1)) : 0,
      ratingCount: ratingAgg[0]?.count || 0,
      byTherapy,
      series,
    },
  })
}
