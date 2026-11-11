import { useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Rating from '@mui/material/Rating'
import { Gauge } from '@mui/x-charts/Gauge'
import { LineChart } from '@mui/x-charts/LineChart'
import { PieChart } from '@mui/x-charts/PieChart'
import PeopleOutline from '@mui/icons-material/PeopleOutlined'
import PersonAddAlt from '@mui/icons-material/PersonAddAlt'
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined'
import Add from '@mui/icons-material/Add'
import { Panel, StatCard } from '../../components/admin/AdminUi.jsx'
import { CHART_COLORS } from '../../config.js'
import BookingDialog from '../../components/admin/BookingDialog.jsx'
import AppointmentActions from '../../components/admin/AppointmentActions.jsx'
import { ErrorState, Loader } from '../../components/common/Feedback.jsx'
import { staffApi } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { firstName, formatDate } from '../../utils/format.js'


// Admin ka overview: aaj ke numbers, growth chart, therapy popularity, aaj ka schedule
const AdminDashboard = () => {
  const { staff } = useAuth()
  const { data, loading, error, reload } = useFetch(() => staffApi.stats())
  const [bookingOpen, setBookingOpen] = useState(false)

  if (loading && !data) return <Loader />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="heading text-3xl sm:text-4xl">Dashboard Overview</h1>
          <p className="text-sm text-muted">Welcome back, {firstName(staff.name)} · {formatDate(data.today, { weekday: 'long' })}</p>
        </div>
        <Button variant="contained" startIcon={<Add />} onClick={() => setBookingOpen(true)}>Add Appointment</Button>
      </div>

      {data.dueReminders > 0 && (
        <Alert severity="warning" action={<Button component={Link} to="/admin/follow-ups" color="inherit" size="small">Open</Button>}>
          {data.dueReminders} follow-up reminder{data.dueReminders > 1 ? 's are' : ' is'} due. Send them to keep customers coming back.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<PeopleOutline />} label="Total Customers" value={data.totalCustomers} />
        <StatCard icon={<PersonAddAlt />} label="New Registrations" value={data.newToday} hint="Today" tone="gold" />
        <StatCard icon={<EventNoteOutlined />} label="Today's Appointments" value={data.todaysAppointments} tone="blue" />
        <StatCard icon={<TaskAltOutlined />} label="Completed Visits" value={data.completedToday} hint="Today" tone="rose" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel title="Repeat Customers">
          <div className="flex items-center gap-4">
            <Gauge value={data.repeatPercent} width={120} height={120} innerRadius="72%" text={`${data.repeatPercent}%`} sx={{ '& .MuiGauge-valueArc': { fill: '#1f5135' }, '& .MuiGauge-valueText text': { fontSize: 22, fontWeight: 600 } }} />
            <p className="text-sm text-muted">of customers who visited came back for another session.</p>
          </div>
        </Panel>
        <Panel title="Average Rating">
          <div className="flex items-center gap-4">
            <p className="font-serif text-6xl font-bold text-brand-700">{data.avgRating || '–'}</p>
            <div>
              <Rating value={data.avgRating} precision={0.1} readOnly />
              <p className="text-sm text-muted">from {data.ratingCount} review{data.ratingCount === 1 ? '' : 's'}</p>
              <Button component={Link} to="/admin/feedback" size="small" sx={{ px: 0 }}>View feedback</Button>
            </div>
          </div>
        </Panel>
        <Panel title="Today's Schedule" action={<Button component={Link} to="/admin/appointments" size="small">Calendar</Button>}>
          {data.upcomingToday.length === 0 ? (
            <p className="text-sm text-muted">No more appointments scheduled today.</p>
          ) : (
            <ul className="-my-1 max-h-40 overflow-y-auto">
              {data.upcomingToday.map((a) => (
                <li key={a._id} className="flex items-center gap-3 border-b border-brand-50 py-2 last:border-0">
                  <span className="w-16 shrink-0 text-xs font-semibold text-brand-700">{a.slot}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{a.customer?.name}</span>
                    <span className="block truncate text-xs text-muted">{a.therapyName}</span>
                  </span>
                  <AppointmentActions appointment={a} onUpdated={reload} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Customer Growth">
          <p className="-mt-3 mb-2 text-xs text-muted">New registrations per month</p>
          <LineChart
            height={260}
            xAxis={[{ scaleType: 'point', data: data.customerGrowth.map((g) => g.label) }]}
            yAxis={[{ tickMinStep: 1, width: 36 }]}
            series={[{ data: data.customerGrowth.map((g) => g.value), area: true, color: '#1f5135', label: 'New customers', showMark: true }]}
            hideLegend
            margin={{ left: 4, right: 12, top: 16, bottom: 4 }}
            sx={{ '& .MuiLineChart-area': { fillOpacity: 0.12 } }}
          />
        </Panel>
        <Panel title="Therapy Popularity">
          {data.therapyPopularity.length === 0 ? (
            <p className="text-sm text-muted">No bookings yet.</p>
          ) : (
            <>
              <PieChart
                height={200}
                series={[{
                  data: data.therapyPopularity.slice(0, 6).map((t, i) => ({ id: i, value: t.count, label: t.name, color: CHART_COLORS[i] })),
                  innerRadius: 55,
                  paddingAngle: 2,
                  cornerRadius: 4,
                }]}
                hideLegend
              />
              <ul className="mt-3 space-y-1.5">
                {data.therapyPopularity.slice(0, 6).map((t, i) => (
                  <li key={t.name} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CHART_COLORS[i] }} />
                    <span className="min-w-0 flex-1 truncate">{t.name}</span>
                    <span className="font-medium">{t.percent}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <BookingDialog open={bookingOpen} onClose={() => setBookingOpen(false)} onBooked={reload} />
    </div>
  )
}

export default AdminDashboard
