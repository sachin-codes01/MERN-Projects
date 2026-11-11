import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { CustomerPicker } from './AdminUi.jsx'
import { staffApi } from '../../api/index.js'
import { useToast } from '../../context/FeedbackContext.jsx'
import { addDays, todayStr } from '../../utils/format.js'

// Staff khud kisi customer ke liye follow-up reminder banaye
const ReminderForm = ({ presetCustomer, onClose, onSaved }) => {
  const [customer, setCustomer] = useState(presetCustomer || null)
  const [dueDate, setDueDate] = useState(addDays(todayStr(), 7))
  const [channel, setChannel] = useState('whatsapp')
  const [message, setMessage] = useState(presetCustomer ? `Hi ${presetCustomer.name.split(' ')[0]}, how are you feeling after your visit? Has your condition improved? Please reply to let us know, or contact the centre if you need support.` : '')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const submit = async () => {
    const errs = {}
    if (!customer) errs.customer = 'Please select a customer'
    if (!dueDate || dueDate < todayStr()) errs.dueDate = 'Please select today or a future date'
    if (message.trim().length < 5) errs.message = 'Please write a short message'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    try {
      await staffApi.createReminder({ customerId: customer._id, dueDate, channel, message: message.trim() })
      toast.success('Reminder scheduled')
      onSaved?.()
      onClose()
    } catch (err) {
      setErrors({ server: err.message })
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'primary.main' }}>Schedule Reminder</DialogTitle>
      <DialogContent dividers>
        <CustomerPicker value={customer} onChange={setCustomer} error={Boolean(errors.customer)} helperText={errors.customer} disabled={Boolean(presetCustomer)} />
        <div className="grid gap-x-4 sm:grid-cols-2">
          <TextField label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} error={Boolean(errors.dueDate)} helperText={errors.dueDate || ' '} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: todayStr() } }} />
          <TextField select label="Channel" value={channel} onChange={(e) => setChannel(e.target.value)} helperText=" ">
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
            <MenuItem value="sms">SMS</MenuItem>
            <MenuItem value="call">Phone call</MenuItem>
          </TextField>
        </div>
        <TextField label="Message" multiline minRows={3} value={message} onChange={(e) => setMessage(e.target.value.slice(0, 500))} error={Boolean(errors.message)} helperText={errors.message || `${message.length}/500`} />
        {errors.server && <Alert severity="error" sx={{ mt: 2 }}>{errors.server}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving}>
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const ReminderDialog = ({ open, ...props }) => (open ? <ReminderForm {...props} /> : null)

export default ReminderDialog
