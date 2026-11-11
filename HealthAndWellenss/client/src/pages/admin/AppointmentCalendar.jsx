import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import Add from '@mui/icons-material/Add'
import BookingDialog from '../../components/admin/BookingDialog.jsx'
import AppointmentActions from '../../components/admin/AppointmentActions.jsx'
import StatusChip from '../../components/common/StatusChip.jsx'
import { ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx'
import { staffApi } from '../../api/index.js'
import { useSettings } from '../../context/SettingsContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { addDays, dayNum, formatDate, formatDayShort, slotToMinutes, todayStr, weekday } from '../../utils/format.js'

const STATUS_BG = {
  scheduled: 'border-l-sky-500 bg-sky-50/70',
  completed: 'border-l-emerald-600 bg-emerald-50/70',
  cancelled: 'border-l-slate-300 bg-slate-50 opacity-70',
  'no-show': 'border-l-amber-500 bg-amber-50/70',
}

// Hafte ka Monday (week view ke liye)
const weekStart = (d) => {
  const day = new Date(`${d}T00:00:00Z`).getUTCDay()
  return addDays(d, -((day + 6) % 7))
}

const AppointmentCard = ({ a, onUpdated }) => (
  <div className={`flex items-center gap-2 rounded-lg border-l-4 px-3 py-2 ${STATUS_BG[a.status]}`}>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium">{a.customer?.name || 'Customer'} <span className="text-xs font-normal text-muted">· {a.customer?.customerId}</span></p>
      <p className="truncate text-xs text-muted">{a.therapyName}{a.therapist && ` · ${a.therapist}`}</p>
    </div>
    <span className="hidden sm:inline-flex"><StatusChip status={a.status} /></span>
    <AppointmentActions appointment={a} onUpdated={onUpdated} />
  </div>
)

// Appointment calendar — Day view (slot wise) aur Week view
const AppointmentCalendar = () => {
  const [params, setParams] = useSearchParams()
  const date = params.get('date') || todayStr()
  const [view, setView] = useState('day')
  const [bookingOpen, setBookingOpen] = useState(false)
  const { settings } = useSettings()

  const from = weekStart(date)
  const to = addDays(from, 6)
  const { data, loading, error, reload } = useFetch(() => staffApi.appointments({ from, to }), [from, to])

  const setDate = (d) => setParams({ date: d }, { replace: true })
  const week = Array.from({ length: 7 }, (_, i) => addDays(from, i))

  const byDate = useMemo(() => {
    const map = {}
    ;(data || []).forEach((a) => (map[a.date] ||= []).push(a))
    return map
  }, [data])

  // Day view: settings ke slots + koi purana slot jisme booking hai
  const dayList = byDate[date] || []
  const slotTimes = [...new Set([...settings.timeSlots, ...dayList.map((a) => a.slot)])].sort((a, b) => slotToMinutes(a) - slotToMinutes(b))
  const activeCount = (list) => list.filter((a) => a.status !== 'cancelled').length

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="heading text-3xl sm:text-4xl">Appointment Calendar</h1>
        <Button variant="contained" startIcon={<Add />} onClick={() => setBookingOpen(true)}>Add Appointment</Button>
      </div>

      <div className="surface mb-4 flex flex-wrap items-center gap-2 p-3">
        <IconButton onClick={() => setDate(addDays(date, view === 'day' ? -1 : -7))} aria-label="Previous"><ChevronLeft /></IconButton>
        <IconButton onClick={() => setDate(addDays(date, view === 'day' ? 1 : 7))} aria-label="Next"><ChevronRight /></IconButton>
        <Button size="small" variant="outlined" onClick={() => setDate(todayStr())}>Today</Button>
        <TextField type="date" size="small" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} sx={{ width: 170 }} />
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} sx={{ ml: 'auto' }}>
          <ToggleButton value="day">Day</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
        </ToggleButtonGroup>
      </div>

      {/* Week strip — har din kitni booking */}
      <div className="no-scrollbar mb-5 grid grid-cols-7 gap-1.5 overflow-x-auto sm:gap-2">
        {week.map((d) => {
          const active = d === date
          const count = activeCount(byDate[d] || [])
          return (
            <button
              key={d}
              onClick={() => setDate(d)}
              className={`flex min-w-11 flex-col items-center rounded-xl border-2 py-2 transition ${active ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-100 bg-white hover:border-brand-300'}`}
            >
              <span className={`text-[10px] uppercase ${active ? 'text-brand-100' : 'text-muted'}`}>{weekday(d)}</span>
              <span className="text-lg font-semibold leading-tight">{dayNum(d)}</span>
              <span className={`mt-0.5 rounded-full px-1.5 text-[10px] ${active ? 'bg-white/20' : count ? 'bg-gold-100 text-gold-700' : 'text-muted'}`}>
                {count || '–'}
              </span>
              {d === todayStr() && <span className={`mt-0.5 h-1 w-1 rounded-full ${active ? 'bg-white' : 'bg-gold-500'}`} />}
            </button>
          )
        })}
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data ? (
        <ListSkeleton rows={5} height={64} />
      ) : view === 'day' ? (
        <section className="surface p-3 sm:p-5">
          <h2 className="mb-3 font-serif text-2xl font-semibold text-brand-700">{formatDate(date, { weekday: 'long' })}</h2>
          {slotTimes.map((slot) => {
            const list = dayList.filter((a) => a.slot === slot)
            const booked = activeCount(list.filter((a) => a.status === 'scheduled'))
            return (
              <div key={slot} className="flex gap-3 border-t border-brand-50 py-3 first:border-0">
                <div className="w-16 shrink-0 pt-1 sm:w-20">
                  <p className="text-sm font-semibold text-brand-700">{slot}</p>
                  <p className="text-[10px] text-muted">{booked}/{settings.slotCapacity || '–'} booked</p>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {list.length ? list.map((a) => <AppointmentCard key={a._id} a={a} onUpdated={reload} />) : <p className="pt-1 text-xs text-muted">Free</p>}
                </div>
              </div>
            )
          })}
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {week.map((d) => (
            <section key={d} className={`surface p-4 ${d === date ? 'ring-2 ring-brand-300' : ''}`}>
              <button onClick={() => { setDate(d); setView('day') }} className="mb-3 font-serif text-xl font-semibold text-brand-700 hover:underline">
                {formatDayShort(d)}
              </button>
              <div className="flex flex-col gap-2">
                {(byDate[d] || []).length ? byDate[d].map((a) => (
                  <div key={a._id} className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-[11px] font-semibold text-muted">{a.slot}</span>
                    <div className="min-w-0 flex-1"><AppointmentCard a={a} onUpdated={reload} /></div>
                  </div>
                )) : <p className="text-xs text-muted">No appointments</p>}
              </div>
            </section>
          ))}
        </div>
      )}

      <BookingDialog open={bookingOpen} initialDate={date} onClose={() => setBookingOpen(false)} onBooked={reload} />
    </div>
  )
}

export default AppointmentCalendar
