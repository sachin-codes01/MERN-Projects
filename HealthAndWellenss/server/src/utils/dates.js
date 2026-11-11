import { TIMEZONE } from '../config/constants.js'

// Saari dates "YYYY-MM-DD" string me rakhte hain (IST ke hisaab se) — timezone ki gadbad nahi hoti

export const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE })

export const isValidDateStr = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

export const addDays = (s, n) => {
  const d = new Date(`${s}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// "01:00 PM" → 780 (minutes) — slots ko sort aur compare karne ke liye
export const slotToMinutes = (slot) => {
  const [, h, m, period] = slot.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/)
  const hours = (Number(h) % 12) + (period === 'PM' ? 12 : 0)
  return hours * 60 + Number(m)
}

// Abhi IST me din ke kitne minute ho gaye
export const nowMinutes = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type) => Number(parts.find((p) => p.type === type).value)
  return get('hour') * 60 + get('minute')
}

// IST din ki shuruaat as Date (createdAt jaise fields se compare karne ke liye; IST = +05:30)
export const startOfDay = (s) => new Date(`${s}T00:00:00+05:30`)
