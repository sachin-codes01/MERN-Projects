import { useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import AlarmOutlined from '@mui/icons-material/AlarmOutlined'
import ExpandMore from '@mui/icons-material/ExpandMore'
import NotificationsActiveOutlined from '@mui/icons-material/NotificationsActiveOutlined'
import PageHeader from '../../components/common/PageHeader.jsx'
import { ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx'
import { customerApi } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/FeedbackContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { daysBetween, formatDate, formatDateTime, todayStr } from '../../utils/format.js'

// Follow-up reminders: agla follow-up, purane reminders, aur message preference ka switch
const Reminders = () => {
  const { data, loading, error, reload } = useFetch(() => customerApi.reminders())
  const { customer, setCustomer } = useAuth()
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const toggleFollowUp = async (checked) => {
    setSaving(true)
    try {
      const res = await customerApi.updateMe({ consent: { followUp: checked } })
      setCustomer(res.data)
      toast.success(checked ? 'Follow-up reminders turned on' : 'Follow-up reminders turned off')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const next = data?.next
  const daysLeft = next ? daysBetween(todayStr(), next.dueDate) : 0

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Follow-up & Reminders" subtitle="Stay on track with your wellness journey" back />

      <div className="reminder-preferences mb-5 flex items-center gap-3 p-4">
        <NotificationsActiveOutlined className="text-brand-500" />
        <div className="flex-1">
          <p className="text-sm font-medium">WhatsApp / SMS follow-ups</p>
          <p className="text-xs text-muted">Get a reminder when it's time for your next session</p>
        </div>
        <FormControlLabel
          sx={{ mr: 0 }}
          control={<Switch checked={Boolean(customer.consent?.followUp)} disabled={saving} onChange={(e) => toggleFollowUp(e.target.checked)} />}
          label=""
          aria-label="Follow-up messages"
        />
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data ? (
        <ListSkeleton rows={2} height={110} />
      ) : (
        <>
          <section className="reminder-feature p-5">
            <div className="flex items-center gap-2 text-brand-700">
              <AlarmOutlined />
              <h2 className="font-serif text-2xl font-semibold">Next Follow-up</h2>
            </div>
            {next ? (
              <div className="mt-4 rounded-xl bg-brand-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-semibold">{formatDate(next.dueDate)}</p>
                  <Chip label="Scheduled" color="info" size="small" variant="outlined" />
                </div>
                <p className="text-xs text-muted">{daysLeft === 0 ? 'Today' : `In ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}</p>
                <p className="mt-3 text-sm">{next.message}</p>
                <p className="mt-2 text-xs text-muted">You'll receive a {next.channel === 'sms' ? 'SMS' : 'WhatsApp message'} from the centre on this date.</p>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm text-muted">
                No follow-up scheduled right now. After each visit we'll set one up for you{customer.consent?.followUp ? '' : ' (turn on follow-ups above)'}.
              </p>
            )}
          </section>

          <h2 className="heading mb-3 mt-8 text-2xl">Past Reminders</h2>
          {data?.past?.length ? (
            data.past.map((r) => (
              <Accordion key={r._id} disableGutters sx={{ mb: 1.5, borderRadius: 3, '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                    <span className="text-sm font-medium">{formatDate(r.dueDate)}</span>
                    <span className="text-xs text-muted">Sent {formatDateTime(r.sentAt)}</span>
                  </div>
                </AccordionSummary>
                <AccordionDetails className="text-sm text-muted">{r.message}</AccordionDetails>
              </Accordion>
            ))
          ) : (
            <p className="surface p-5 text-sm text-muted">No past reminders yet.</p>
          )}
        </>
      )}
    </div>
  )
}

export default Reminders
