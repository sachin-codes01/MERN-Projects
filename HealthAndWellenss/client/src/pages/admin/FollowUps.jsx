import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Add from '@mui/icons-material/Add'
import WhatsApp from '@mui/icons-material/WhatsApp'
import Sms from '@mui/icons-material/Sms'
import Phone from '@mui/icons-material/Phone'
import DoneAll from '@mui/icons-material/DoneAll'
import Close from '@mui/icons-material/Close'
import AlarmOutlined from '@mui/icons-material/AlarmOutlined'
import ReminderDialog from '../../components/admin/ReminderDialog.jsx'
import { EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx'
import { staffApi } from '../../api/index.js'
import { useConfirm, useToast } from '../../context/FeedbackContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { whatsappLink } from '../../utils/downloads.js'
import { daysBetween, formatDate, formatDateTime, todayStr } from '../../utils/format.js'

const STATUSES = ['scheduled', 'sent', 'cancelled']

// Follow-up reminders: WhatsApp pe bhejo (ek click me message ready), phir "sent" mark karo
const FollowUps = () => {
  const [tab, setTab] = useState(0)
  const [dueOnly, setDueOnly] = useState(false)
  const [creating, setCreating] = useState(false)
  const status = STATUSES[tab]
  const { data, loading, error, reload, setData } = useFetch(() => staffApi.reminders({ status, due: dueOnly && status === 'scheduled' ? 'today' : '' }), [status, dueOnly])
  const confirm = useConfirm()
  const toast = useToast()
  const today = todayStr()

  const update = async (r, body, message) => {
    try {
      await staffApi.updateReminder(r._id, body)
      setData((list) => list.filter((x) => x._id !== r._id))
      toast.success(message)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const cancel = async (r) => {
    if (await confirm({ title: 'Cancel this reminder?', confirmText: 'Cancel reminder', danger: true })) update(r, { status: 'cancelled' }, 'Reminder cancelled')
  }

  const channelIcon = { whatsapp: <WhatsApp fontSize="small" />, sms: <Sms fontSize="small" />, call: <Phone fontSize="small" /> }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="heading text-3xl sm:text-4xl">Follow-ups & Reminders</h1>
          <p className="text-sm text-muted">Auto-created after each completed visit for customers who opted in</p>
        </div>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreating(true)}>New Reminder</Button>
      </div>

      <div className="surface mb-4 flex flex-wrap items-center justify-between gap-2 px-2">
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Scheduled" />
          <Tab label="Sent" />
          <Tab label="Cancelled" />
        </Tabs>
        {status === 'scheduled' && (
          <FormControlLabel control={<Switch checked={dueOnly} onChange={(e) => setDueOnly(e.target.checked)} size="small" />} label={<span className="text-sm">Due now only</span>} sx={{ mr: 1 }} />
        )}
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data ? (
        <ListSkeleton rows={4} height={96} />
      ) : data?.length === 0 ? (
        <EmptyState icon={<AlarmOutlined />} title="Nothing here" message={status === 'scheduled' ? 'No follow-ups are pending. Great job!' : `No ${status} reminders.`} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {data?.map((r) => {
            const diff = daysBetween(today, r.dueDate)
            const overdue = status === 'scheduled' && diff < 0
            const dueNow = status === 'scheduled' && diff <= 0
            return (
              <article key={r._id} className={`surface flex flex-col gap-3 p-4 ${dueNow ? 'border-gold-300' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/customers/${r.customer?._id}`} className="font-medium hover:text-brand-700 hover:underline">
                      {r.customer?.name}
                    </Link>
                    <p className="text-xs text-muted">{r.customer?.customerId} · +91 {r.customer?.mobile}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${overdue ? 'text-red-600' : ''}`}>{formatDate(r.dueDate)}</p>
                    {status === 'scheduled' && (
                      <Chip size="small" label={overdue ? `${-diff}d overdue` : diff === 0 ? 'Due today' : `in ${diff}d`} color={overdue ? 'error' : diff === 0 ? 'warning' : 'default'} variant="outlined" />
                    )}
                    {status === 'sent' && <p className="text-xs text-muted">Sent {formatDateTime(r.sentAt)}</p>}
                  </div>
                </div>
                <p className="rounded-lg bg-brand-50/60 p-3 text-sm">{r.message}</p>
                {status === 'scheduled' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-muted">{channelIcon[r.channel]} {r.channel}</span>
                    {r.customer?.consent && !r.customer.consent.followUp && <Chip size="small" color="warning" label="Opted out" />}
                    <div className="ml-auto flex items-center gap-1">
                      <Button size="small" color="success" variant="outlined" startIcon={<WhatsApp />} href={whatsappLink(r.customer?.mobile, r.message)} target="_blank" rel="noreferrer">
                        Send
                      </Button>
                      <Button size="small" variant="contained" startIcon={<DoneAll />} onClick={() => update(r, { status: 'sent' }, 'Marked as sent')}>
                        Mark sent
                      </Button>
                      <Tooltip title="Cancel reminder">
                        <IconButton size="small" onClick={() => cancel(r)} aria-label="Cancel reminder"><Close fontSize="small" /></IconButton>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <ReminderDialog open={creating} onClose={() => setCreating(false)} onSaved={() => tab === 0 && reload()} />
    </div>
  )
}

export default FollowUps
