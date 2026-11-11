// Default settings — pehli baar DB me "settings" document yahin se banta hai,
// uske baad admin panel (Settings page) se sab badla ja sakta hai
export const DEFAULT_SETTINGS = {
  centreName: 'Shree Radhey Shyam Health & Wellness Centre',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  openingHours: '10:00 AM – 7:00 PM, Monday to Sunday',
  timeSlots: ['10:00 AM', '11:30 AM', '01:00 PM', '03:00 PM', '04:30 PM', '06:00 PM'],
  slotCapacity: 2, // ek slot me kitne customer (jitne therapist/room)
  bookingWindowDays: 14, // kitne din aage tak booking ho sakti hai
  pointsPerVisit: 10,
  pointValue: 1, // 1 point = ₹1
  followUpAfterDays: 7,
  silverVisits: 3,
  goldVisits: 10,
}

export const TIMEZONE = 'Asia/Kolkata'

export const MOBILE_REGEX = /^[6-9]\d{9}$/
export const EMAIL_REGEX = /^\S+@\S+\.\S+$/
export const SLOT_REGEX = /^(0[1-9]|1[0-2]):[0-5]\d (AM|PM)$/

export const TIER_RANK = { Bronze: 0, Silver: 1, Gold: 2 }

// Visits ke hisaab se membership tier
export const getTier = (visits, settings) => {
  if (visits >= settings.goldVisits) return 'Gold'
  if (visits >= settings.silverVisits) return 'Silver'
  return 'Bronze'
}
