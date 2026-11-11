import { useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Rating from '@mui/material/Rating'
import EventAvailable from '@mui/icons-material/EventAvailable'
import HistoryOutlined from '@mui/icons-material/HistoryOutlined'
import WorkspacePremiumOutlined from '@mui/icons-material/WorkspacePremiumOutlined'
import PersonOutline from '@mui/icons-material/PersonOutlined'
import AlarmOutlined from '@mui/icons-material/AlarmOutlined'
import SpaOutlined from '@mui/icons-material/SpaOutlined'
import QrCode2 from '@mui/icons-material/QrCode2'
import ChevronRight from '@mui/icons-material/ChevronRight'
import CalendarMonth from '@mui/icons-material/CalendarMonth'
import QrCard from '../../components/common/QrCard.jsx'
import { TierChip } from '../../components/common/StatusChip.jsx'
import { ListSkeleton } from '../../components/common/Feedback.jsx'
import { customerApi } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { addDays, firstName, formatDate, formatDayShort, greeting, initials, todayStr } from '../../utils/format.js'

const ACTIONS = [
  { to: '/book', label: 'Book Appointment', icon: <EventAvailable /> },
  { to: '/history', label: 'My History', icon: <HistoryOutlined /> },
  { to: '/loyalty', label: 'Loyalty & Offers', icon: <WorkspacePremiumOutlined /> },
  { to: '/profile', label: 'Profile', icon: <PersonOutline /> },
  { to: '/reminders', label: 'Reminders', icon: <AlarmOutlined /> },
  { to: '/therapies', label: 'Therapies', icon: <SpaOutlined /> },
]

// Customer ka home: agla appointment, quick links, recent visits, follow-up
const Dashboard = () => {
  const { customer } = useAuth()
  const [qrOpen, setQrOpen] = useState(false)
  const upcoming = useFetch(() => customerApi.appointments('upcoming'))
  const history = useFetch(() => customerApi.appointments('history'))
  const reminders = useFetch(() => customerApi.reminders())

  const next = upcoming.data?.[0]
  const today = todayStr()
  const isSoon = next && (next.date === today || next.date === addDays(today, 1))
  const unrated = history.data?.find((v) => !v.rating)

  return (
    <div className="customer-home flex flex-col gap-9">
      {/* Greeting */}
      <section className="home-greeting flex flex-wrap items-center gap-4">
        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 20 }}>{initials(customer.name)}</Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{greeting()},</p>
          <h1 className="heading truncate text-3xl">{firstName(customer.name)}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="font-medium tracking-wide">{customer.customerId}</span>
            <TierChip tier={customer.tier} />
          </div>
        </div>
        <Button variant="outlined" startIcon={<QrCode2 />} onClick={() => setQrOpen(true)}>
          My QR
        </Button>
      </section>

      {/* Reminder banner — appointment aaj ya kal ho to */}
      {isSoon && (
        <Alert severity="info" icon={<AlarmOutlined />}>
          Reminder: your <b>{next.therapyName}</b> is {next.date === today ? 'today' : 'tomorrow'} at <b>{next.slot}</b>. Please arrive 10 minutes early.
        </Alert>
      )}
      {unrated && !isSoon && (
        <Alert
          severity="success"
          action={<Button component={Link} to={`/rate/${unrated._id}`} color="inherit" size="small">Rate now</Button>}
        >
          How was your {unrated.therapyName}? Your feedback helps us improve.
        </Alert>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Next appointment */}
        <section className="home-section px-5 py-6 sm:px-7">
          <div className="mb-4 flex items-center gap-2 text-brand-700">
            <CalendarMonth />
            <h2 className="font-serif text-2xl font-semibold">Next Appointment</h2>
          </div>
          {upcoming.loading && !upcoming.data ? (
            <ListSkeleton rows={1} height={90} />
          ) : next ? (
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-brand-50 p-4">
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">
                <span className="text-xs uppercase">{formatDayShort(next.date).split(',')[0]}</span>
                <span className="text-2xl font-semibold leading-none">{Number(next.date.slice(8))}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{next.therapyName}</p>
                <p className="text-sm text-muted">{formatDate(next.date)} · {next.slot}</p>
                <p className="text-xs text-muted">ID: {next.appointmentId}</p>
              </div>
              <Button component={Link} to="/appointments" size="small">View</Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 p-4">
              <p className="text-sm text-muted">Not scheduled yet</p>
              <Button component={Link} to="/book" variant="contained" size="small">Book Now</Button>
            </div>
          )}
          {upcoming.data?.length > 1 && (
            <p className="mt-3 text-xs text-muted">+ {upcoming.data.length - 1} more upcoming</p>
          )}
        </section>

        {/* Follow-up */}
        <section className="surface p-5">
          <div className="mb-4 flex items-center gap-2 text-brand-700">
            <AlarmOutlined />
            <h2 className="font-serif text-2xl font-semibold">Next Follow-up</h2>
          </div>
          {reminders.data?.next ? (
            <div className="rounded-xl bg-gold-100/60 p-4">
              <p className="font-medium">{formatDate(reminders.data.next.dueDate)}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{reminders.data.next.message}</p>
            </div>
          ) : (
            <p className="rounded-xl bg-brand-50 p-4 text-sm text-muted">No follow-up scheduled. We'll remind you after your next visit.</p>
          )}
          <Button component={Link} to="/reminders" size="small" sx={{ mt: 2 }} endIcon={<ChevronRight />}>
            All reminders
          </Button>
        </section>
      </div>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-6">
        {ACTIONS.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="flex items-center gap-3 border-b border-brand-200 py-5 transition-colors hover:text-brand-700"
          >
            <span className="flex shrink-0 items-center justify-center text-brand-700">{a.icon}</span>
            <span className="text-xs font-medium leading-tight text-ink">{a.label}</span>
          </Link>
        ))}
      </section>

      {/* Recent visits */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="heading text-2xl">Recent Visits</h2>
          <Button component={Link} to="/history" size="small">View All</Button>
        </div>
        {history.loading && !history.data ? (
          <ListSkeleton rows={2} />
        ) : history.data?.length ? (
          <div className="divide-y divide-brand-200">
            {history.data.slice(0, 4).map((v) => (
              <div key={v._id} className="flex flex-wrap items-center gap-3 py-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500"><SpaOutlined /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{v.therapyName}</p>
                  <p className="text-xs text-muted">{formatDate(v.date)} · {v.duration}</p>
                </div>
                {v.rating ? (
                  <Rating value={v.rating} readOnly size="small" />
                ) : (
                  <Button component={Link} to={`/rate/${v._id}`} size="small">Rate</Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="border-t border-brand-200 py-6 text-sm text-muted">Your visits will appear here after your first session.</p>
        )}
      </section>

      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="xs">
        <DialogContent sx={{ p: 2 }}>
          <QrCard customer={customer} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Dashboard
