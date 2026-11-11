import { Link, useParams } from 'react-router-dom'
import Button from '@mui/material/Button'
import CheckCircle from '@mui/icons-material/CheckCircle'
import EventOutlined from '@mui/icons-material/EventOutlined'
import { ErrorState, Loader } from '../../components/common/Feedback.jsx'
import { customerApi } from '../../api/index.js'
import { useSettings } from '../../context/SettingsContext.jsx'
import { useToast } from '../../context/FeedbackContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { downloadIcs } from '../../utils/downloads.js'
import { formatCurrency, formatDate } from '../../utils/format.js'

// Booking ke baad confirmation — Appointment ID + calendar me add karne ka button
const AppointmentConfirmed = () => {
  const { id } = useParams()
  const { data: appt, loading, error, reload } = useFetch(() => customerApi.appointment(id), [id])
  const { settings } = useSettings()
  const toast = useToast()

  if (loading && !appt) return <Loader />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const addToCalendar = () => {
    downloadIcs(appt, settings)
    toast.success('Calendar file downloaded — open it to add the reminder')
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="surface px-6 py-8 text-center">
        <CheckCircle sx={{ fontSize: 72 }} className="text-brand-500" />
        <h1 className="heading mt-2 text-4xl">Appointment Confirmed!</h1>
        <p className="mt-3 text-lg font-medium">{formatDate(appt.date, { weekday: 'long' })}</p>
        <p className="text-2xl font-semibold text-brand-700">{appt.slot}</p>
        <p className="mt-3 text-sm text-muted">
          Your <b>{appt.therapyName}</b> has been successfully booked. We look forward to seeing you!
        </p>

        <div className="mt-6 rounded-xl border border-dashed border-gold-300 bg-gold-100/40 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-700">Appointment ID</p>
          <p className="mt-1 text-lg font-semibold tracking-wide">{appt.appointmentId}</p>
          <p className="mt-1 text-sm text-muted">
            Pay at centre: <b className="text-ink">{formatCurrency(appt.finalPrice)}</b>
            {appt.discount > 0 && <span className="text-brand-500"> (saved {formatCurrency(appt.discount)})</span>}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button component={Link} to="/appointments" variant="contained" size="large">
            View Details
          </Button>
          <Button variant="outlined" size="large" startIcon={<EventOutlined />} onClick={addToCalendar}>
            Add to Calendar
          </Button>
          <Button component={Link} to="/home">Back to Home</Button>
        </div>
      </div>
    </div>
  )
}

export default AppointmentConfirmed
