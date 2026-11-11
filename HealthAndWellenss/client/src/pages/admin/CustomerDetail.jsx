import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Rating from '@mui/material/Rating'
import Switch from '@mui/material/Switch'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Phone from '@mui/icons-material/Phone'
import WhatsApp from '@mui/icons-material/WhatsApp'
import EventAvailable from '@mui/icons-material/EventAvailable'
import AlarmAdd from '@mui/icons-material/AlarmAdd'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatusChip, { TierChip } from '../../components/common/StatusChip.jsx'
import { ErrorState, Loader } from '../../components/common/Feedback.jsx'
import { Panel, StatCard } from '../../components/admin/AdminUi.jsx'
import BookingDialog from '../../components/admin/BookingDialog.jsx'
import ReminderDialog from '../../components/admin/ReminderDialog.jsx'
import AppointmentActions from '../../components/admin/AppointmentActions.jsx'
import { staffApi } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useConfirm, useToast } from '../../context/FeedbackContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { whatsappLink } from '../../utils/downloads.js'
import { formatCurrency, formatDate, formatDateTime, initials, maskMobile } from '../../utils/format.js'

const Info = ({ label, value }) => (
  <div>
    <dt className="text-xs text-muted">{label}</dt>
    <dd className="text-sm">{value || '—'}</dd>
  </div>
)

// Ek customer ki poori file — QR scan karke staff yahin aata hai
const CustomerDetail = () => {
  const { id } = useParams()
  const { staff } = useAuth()
  const { data: c, loading, error, reload, setData } = useFetch(() => staffApi.customer(id), [id])
  const [tab, setTab] = useState(0)
  const [notes, setNotes] = useState(null)
  const [savingNotes, setSavingNotes] = useState(false)
  const [booking, setBooking] = useState(false)
  const [reminder, setReminder] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  if (loading && !c) return <Loader />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await staffApi.updateCustomer(c._id, { staffNotes: notes })
      setData(res.data)
      setNotes(null)
      toast.success('Notes saved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingNotes(false)
    }
  }

  const toggleActive = async (isActive) => {
    if (!isActive && !(await confirm({ title: 'Deactivate this customer?', message: 'They will not be able to log in or book until reactivated.', confirmText: 'Deactivate', danger: true }))) return
    try {
      const res = await staffApi.updateCustomer(c._id, { isActive })
      setData(res.data)
      toast.success(isActive ? 'Customer activated' : 'Customer deactivated')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const spent = c.appointments.filter((a) => a.status === 'completed').reduce((s, a) => s + a.finalPrice, 0)
  const avgRating = c.feedback.length ? (c.feedback.reduce((s, f) => s + f.rating, 0) / c.feedback.length).toFixed(1) : '–'

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Customer Profile" back="/admin/customers" />

      <section className="surface flex flex-wrap items-center gap-4 p-5">
        <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 22 }}>{initials(c.name)}</Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="heading text-3xl">{c.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="font-medium tracking-wide text-ink">{c.customerId}</span>
            <span>· +91 {maskMobile(c.mobile)}</span>
            <TierChip tier={c.tier} />
            {!c.isActive && <Chip label="Inactive" color="error" size="small" />}
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Button variant="contained" startIcon={<EventAvailable />} onClick={() => setBooking(true)} disabled={!c.isActive}>Book</Button>
          <Button variant="outlined" startIcon={<AlarmAdd />} onClick={() => setReminder(true)}>Reminder</Button>
          <Button variant="outlined" startIcon={<Phone />} href={`tel:+91${c.mobile}`}>Call</Button>
          <Button variant="outlined" color="success" startIcon={<WhatsApp />} href={whatsappLink(c.mobile, `Hello ${c.name.split(' ')[0]}, `)} target="_blank" rel="noreferrer">WhatsApp</Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<EventAvailable />} label="Visits" value={c.visitsCount} />
        <StatCard icon={<span className="text-lg font-bold">★</span>} label="Loyalty points" value={c.loyaltyPoints} tone="gold" />
        <StatCard icon={<span className="text-lg font-bold">₹</span>} label="Total spent" value={formatCurrency(spent)} tone="blue" />
        <StatCard icon={<span className="text-lg font-bold">☆</span>} label="Avg. rating given" value={avgRating} tone="rose" />
      </div>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-5">
          <Panel title="Personal">
            <dl className="grid grid-cols-2 gap-4">
              <Info label="Date of birth" value={formatDate(c.dob)} />
              <Info label="Email" value={c.email} />
              <div className="col-span-2"><Info label="Address" value={c.address} /></div>
              <Info label="Registered" value={formatDateTime(c.createdAt)} />
              <Info label="Last visit" value={formatDateTime(c.lastVisitAt)} />
            </dl>
          </Panel>
          <Panel title="Wellness">
            <dl className="grid grid-cols-2 gap-4">
              <Info label="Main concern" value={c.wellness?.concern} />
              <Info label="Body area" value={c.wellness?.bodyArea} />
              <div className="col-span-2"><Info label="Details" value={c.wellness?.details} /></div>
              <div className="col-span-2"><Info label="History" value={c.wellness?.history} /></div>
            </dl>
          </Panel>
          <Panel title="Consent">
            <div className="flex flex-wrap gap-2">
              <Chip size="small" color="success" variant="outlined" label="Privacy accepted" />
              <Chip size="small" color={c.consent?.followUp ? 'success' : 'default'} variant="outlined" label={`Follow-ups: ${c.consent?.followUp ? 'Yes' : 'No'}`} />
              <Chip size="small" color={c.consent?.promotional ? 'success' : 'default'} variant="outlined" label={`Promotions: ${c.consent?.promotional ? 'Yes' : 'No'}`} />
            </div>
            {staff.role === 'admin' && (
              <FormControlLabel sx={{ mt: 2 }} control={<Switch checked={c.isActive} onChange={(e) => toggleActive(e.target.checked)} />} label={<span className="text-sm">Account active</span>} />
            )}
          </Panel>
          <Panel title="Staff Notes">
            <TextField
              multiline
              minRows={3}
              placeholder="Private notes for staff (not visible to customer)"
              value={notes ?? c.staffNotes}
              onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
            />
            {notes !== null && notes !== c.staffNotes && (
              <Button variant="contained" size="small" sx={{ mt: 2 }} onClick={saveNotes} disabled={savingNotes}>
                {savingNotes ? <CircularProgress size={18} color="inherit" /> : 'Save notes'}
              </Button>
            )}
          </Panel>
        </div>

        <section className="surface overflow-hidden">
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
            <Tab label={`Appointments (${c.appointments.length})`} />
            <Tab label={`Feedback (${c.feedback.length})`} />
            <Tab label={`Reminders (${c.reminders.length})`} />
          </Tabs>
          <div className="max-h-[640px] overflow-y-auto p-2 sm:p-3">
            {tab === 0 &&
              (c.appointments.length ? c.appointments.map((a) => (
                <div key={a._id} className="flex items-center gap-3 border-b border-brand-50 px-2 py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.therapyName}</p>
                    <p className="text-xs text-muted">{formatDate(a.date)} · {a.slot} · {a.appointmentId}</p>
                    {a.therapist && <p className="text-xs text-muted">Therapist: {a.therapist}</p>}
                  </div>
                  <span className="hidden text-sm font-medium sm:block">{formatCurrency(a.finalPrice)}</span>
                  <StatusChip status={a.status} />
                  <AppointmentActions appointment={{ ...a, customer: { _id: c._id, name: c.name } }} onUpdated={reload} showCustomerLink={false} />
                </div>
              )) : <p className="p-4 text-sm text-muted">No appointments yet.</p>)}
            {tab === 1 &&
              (c.feedback.length ? c.feedback.map((f) => (
                <div key={f._id} className="border-b border-brand-50 px-2 py-3 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <Rating value={f.rating} readOnly size="small" />
                    <span className="text-xs text-muted">{formatDateTime(f.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted">{f.therapyName}</p>
                  {f.comment && <p className="mt-1 text-sm">“{f.comment}”</p>}
                </div>
              )) : <p className="p-4 text-sm text-muted">No feedback yet.</p>)}
            {tab === 2 &&
              (c.reminders.length ? c.reminders.map((r) => (
                <div key={r._id} className="flex items-start gap-3 border-b border-brand-50 px-2 py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{formatDate(r.dueDate)}</p>
                    <p className="text-xs text-muted">{r.message}</p>
                  </div>
                  <StatusChip status={r.status} />
                </div>
              )) : <p className="p-4 text-sm text-muted">No reminders yet.</p>)}
          </div>
        </section>
      </div>

      <BookingDialog open={booking} presetCustomer={c} onClose={() => setBooking(false)} onBooked={reload} />
      <ReminderDialog open={reminder} presetCustomer={c} onClose={() => setReminder(false)} onSaved={reload} />
    </div>
  )
}

export default CustomerDetail
