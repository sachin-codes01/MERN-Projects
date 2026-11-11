import Skeleton from '@mui/material/Skeleton'
import { addDays, dayNum, monthShort, todayStr, weekday } from '../../utils/format.js'

// Agle N din ki date strip (horizontal scroll) — booking page aur admin booking dono me
export const DateStrip = ({ value, onChange, days = 14 }) => {
  const today = todayStr()
  const dates = Array.from({ length: days + 1 }, (_, i) => addDays(today, i))

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="listbox" aria-label="Select date">
      {dates.map((d) => {
        const active = d === value
        return (
          <button
            key={d}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onChange(d)}
            className={`flex w-16 shrink-0 flex-col items-center rounded-xl border-2 py-2 transition ${
              active ? 'border-brand-700 bg-brand-700 text-white shadow-md' : 'border-brand-100 bg-white hover:border-brand-300'
            }`}
          >
            <span className={`text-[11px] uppercase ${active ? 'text-brand-100' : 'text-muted'}`}>{d === today ? 'Today' : weekday(d)}</span>
            <span className="text-xl font-semibold leading-tight">{dayNum(d)}</span>
            <span className={`text-[11px] ${active ? 'text-brand-100' : 'text-muted'}`}>{monthShort(d)}</span>
          </button>
        )
      })}
    </div>
  )
}

// Time slots ki grid — bhare hue / beete hue slots disabled
export const SlotGrid = ({ slots, loading, value, onChange }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 3 }} />)}
      </div>
    )
  }
  if (!slots?.length) return <p className="text-sm text-muted">No time slots available.</p>
  if (slots.every((s) => !s.available)) {
    return (
      <p className="rounded-xl bg-gold-100/60 p-3 text-sm text-gold-700">
        {slots.every((s) => s.passed) ? 'All slots for today have passed.' : 'All slots are full for this day.'} Please choose another date.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((s) => {
        const active = s.time === value
        return (
          <button
            key={s.time}
            type="button"
            disabled={!s.available}
            onClick={() => onChange(s.time)}
            aria-pressed={active}
            className={`flex flex-col items-center rounded-xl border-2 px-2 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              active ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-100 bg-white hover:border-brand-300'
            }`}
          >
            {s.time}
            <span className={`text-[10px] font-normal ${active ? 'text-brand-100' : 'text-muted'}`}>
              {s.passed ? 'Passed' : s.available ? (s.left === 1 ? '1 spot left' : 'Available') : 'Full'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
