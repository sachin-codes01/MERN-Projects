import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '@mui/material/Button'
import EventOutlined from '@mui/icons-material/EventOutlined'
import EventBusy from '@mui/icons-material/EventBusy'
import Add from '@mui/icons-material/Add'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatusChip from '../../components/common/StatusChip.jsx'
import { EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx'
import { customerApi } from '../../api/index.js'
import { useConfirm, useToast } from '../../context/FeedbackContext.jsx'
import { useSettings } from '../../context/SettingsContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { downloadIcs } from '../../utils/downloads.js'
import { formatCurrency, formatDate, weekday, dayNum, monthShort } from '../../utils/format.js'

// Aane wale appointments — calendar me add, ya cancel (confirm popup ke saath)
const Appointments = () => {
  const { data, loading, error, reload, setData } = useFetch(() => customerApi.appointments('upcoming'))
  const [busyId, setBusyId] = useState('')
  const { settings } = useSettings()
  const confirm = useConfirm()
  const toast = useToast()

  const cancel = async (a) => {
    const ok = await confirm({
      title: 'Cancel appointment?',
      message: `${a.therapyName} on ${formatDate(a.date)} at ${a.slot} will be cancelled. This cannot be undone.`,
      confirmText: 'Yes, cancel',
      cancelText: 'Keep it',
      danger: true,
    })
    if (!ok) return
    setBusyId(a._id)
    try {
      await customerApi.cancel(a._id)
      setData((list) => list.filter((x) => x._id !== a._id))
      toast.success('Appointment cancelled')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId('')
    }
  }

  return (
    <div>
      <PageHeader
        title="My Appointments"
        subtitle="Your upcoming sessions"
        action={<Button component={Link} to="/book" variant="contained" startIcon={<Add />}>Book</Button>}
      />

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data ? (
        <ListSkeleton rows={3} height={120} />
      ) : data?.length === 0 ? (
        <EmptyState
          icon={<EventOutlined />}
          title="No upcoming appointments"
          message="Book a session and it will show up here."
          action={<Button component={Link} to="/book" variant="contained">Book Appointment</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((a) => (
            <article key={a._id} className="surface flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-sm bg-brand-700 text-white">
                  <span className="text-[11px] uppercase">{weekday(a.date)}</span>
                  <span className="text-2xl font-semibold leading-none">{dayNum(a.date)}</span>
                  <span className="text-[11px]">{monthShort(a.date)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{a.therapyName}</p>
                  <p className="text-sm text-muted">{a.slot} · {a.duration}</p>
                  <p className="mt-1 text-xs text-muted">ID: {a.appointmentId} · {formatCurrency(a.finalPrice)}</p>
                </div>
                <StatusChip status={a.status} />
              </div>
              <div className="flex flex-wrap gap-2 border-t border-brand-100 pt-3">
                <Button size="small" startIcon={<EventOutlined />} onClick={() => downloadIcs(a, settings)}>
                  Add to Calendar
                </Button>
                <Button size="small" color="error" startIcon={<EventBusy />} disabled={busyId === a._id} onClick={() => cancel(a)} sx={{ ml: 'auto' }}>
                  Cancel
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        Looking for past sessions?{' '}
        <Link to="/history" className="font-medium text-brand-700 hover:underline">View visit history</Link>
      </p>
    </div>
  )
}

export default Appointments
