import Offer from '../models/Offer.js'
import Appointment from '../models/Appointment.js'
import { TIER_RANK } from '../config/constants.js'
import { todayStr } from '../utils/dates.js'
import { tierFor } from './settingsService.js'

// Customer ke liye abhi kaun se offers use ho sakte hain:
// active ho, expire na hua ho, tier kaafi ho, aur (once-per-customer wala) pehle use na kiya ho
export const getEligibleOffers = async (customer) => {
  const tier = await tierFor(customer.visitsCount)
  const [offers, usedIds] = await Promise.all([
    Offer.find({ isActive: true, validTill: { $gte: todayStr() } }).sort({ validTill: 1 }).lean(),
    Appointment.distinct('offer', { customer: customer._id, status: { $ne: 'cancelled' }, offer: { $ne: null } }),
  ])
  const used = new Set(usedIds.map(String))

  return offers.filter(
    (o) => TIER_RANK[tier] >= TIER_RANK[o.minTier] && !(o.oncePerCustomer && used.has(String(o._id))),
  )
}
