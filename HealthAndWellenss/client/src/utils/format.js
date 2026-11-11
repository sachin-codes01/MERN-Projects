// Dates "YYYY-MM-DD" string me aati hain (IST) — UTC me parse karke format karte hain taaki din na khiske
const TZ = 'Asia/Kolkata'

const parse = (s) => new Date(`${s}T00:00:00Z`)

export const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ })

export const ageFromDob = (dob, today = todayStr()) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob || '') || dob > today) return null
  const date = parse(dob)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dob) return null
  return Number(today.slice(0, 4)) - Number(dob.slice(0, 4)) - (today.slice(5) < dob.slice(5) ? 1 : 0)
}

export const addDays = (s, n) => {
  const d = parse(s)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export const daysBetween = (from, to) => Math.round((parse(to) - parse(from)) / 86400000)

// "2025-10-16" → "16 Oct 2025"
export const formatDate = (s, options = {}) =>
  s ? parse(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', ...options }) : ''

// "2025-10-16" → "Thu, 16 Oct"
export const formatDayShort = (s) =>
  parse(s).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

export const weekday = (s) => parse(s).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' })
export const dayNum = (s) => parse(s).getUTCDate()
export const monthShort = (s) => parse(s).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' })

// ISO timestamp (createdAt) → "16 Oct 2025"
export const formatDateTime = (iso, withTime = false) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: TZ,
        ...(withTime && { hour: '2-digit', minute: '2-digit' }),
      })
    : ''

// "5 min ago", "2 days ago"
export const timeAgo = (iso) => {
  const sec = Math.max(1, Math.round((Date.now() - new Date(iso)) / 1000))
  if (sec < 60) return 'just now'
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  const [unit, size] = units.find(([, s]) => sec >= s)
  const n = Math.floor(sec / size)
  return `${n} ${unit}${n > 1 ? 's' : ''} ago`
}

export const formatCurrency = (n = 0) => `₹${Number(n).toLocaleString('en-IN')}`

export const durationLabel = (t) => (t ? `${t.durationMin}–${t.durationMax} mins` : '')

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

export const firstName = (name = '') => name.split(' ')[0]

// "01:00 PM" → minutes
export const slotToMinutes = (slot) => {
  const [, h, m, p] = slot.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/) || []
  if (!h) return 0
  return ((Number(h) % 12) + (p === 'PM' ? 12 : 0)) * 60 + Number(m)
}

export const greeting = () => {
  const hour = Number(new Date().toLocaleString('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: TZ }))
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export const maskMobile = (m = '') => (m.length === 10 ? `${m.slice(0, 5)} ${m.slice(5)}` : m)
