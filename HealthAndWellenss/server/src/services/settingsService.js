import Setting from '../models/Setting.js'
import { DEFAULT_SETTINGS, getTier } from '../config/constants.js'

// Settings har request pe DB se na padhni padein isliye memory me cache —
// admin update kare to cache turant refresh ho jaata hai
let cache = null

export const getSettings = async () => {
  if (cache) return cache
  let doc = await Setting.findById('centre').lean()
  if (!doc) {
    doc = (await Setting.create({ _id: 'centre', ...DEFAULT_SETTINGS })).toObject()
  }
  cache = { ...DEFAULT_SETTINGS, ...doc }
  return cache
}

export const updateSettings = async (changes) => {
  const doc = await Setting.findById('centre')
  doc.set(changes)
  await doc.save()
  cache = null
  return getSettings()
}

export const tierFor = async (visits) => getTier(visits, await getSettings())

// Website pe sabko dikhne wali (public) settings
export const publicSettings = (s) => ({
  centreName: s.centreName,
  phone: s.phone,
  whatsapp: s.whatsapp,
  email: s.email,
  address: s.address,
  openingHours: s.openingHours,
  timeSlots: s.timeSlots,
  slotCapacity: s.slotCapacity,
  bookingWindowDays: s.bookingWindowDays,
  pointValue: s.pointValue,
  pointsPerVisit: s.pointsPerVisit,
  silverVisits: s.silverVisits,
  goldVisits: s.goldVisits,
})
