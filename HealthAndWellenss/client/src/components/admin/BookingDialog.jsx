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
import useMediaQuery from '@mui/material/useMediaQuery'
import { CustomerPicker } from './AdminUi.jsx'
import { DateStrip, SlotGrid } from '../common/SlotPicker.jsx'
import { publicApi, staffApi } from '../../api/index.js'
import { useToast } from '../../context/FeedbackContext.jsx'
import { useSettings } from '../../context/SettingsContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { formatCurrency, todayStr } from '../../utils/format.js'

// Staff walk-in / phone booking ke liye — customer chuno, therapy, date, slot
const BookingForm = ({ presetCustomer, initialDate, onClose, onBooked }) => {
  const { settings } = useSettings()
  const toast = useToast()
  const fullScreen = useMediaQuery('(max-width:640px)')
  const therapies = useFetch(() => publicApi.therapies())
  const [customer, setCustomer] = useState(presetCustomer || null)
  const [therapyId, setTherapyId] = useState('')
  const [date, setDate] = useState(initialDate && initialDate >= todayStr() ? initialDate : todayStr())
  const [slot, setSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const slots = useFetch(() => publicApi.slots(date), [date])

  const submit = async () => {
    const errs = {}
    if (!customer) errs.customer = 'Please select a customer'
    if (!therapyId) errs.therapy = 'Please select a therapy'
    if (!slot) errs.slot = 'Please select a time slot'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    try {
      const res = await staffApi.book({ customerId: customer._id, therapyId, date, slot, notes: notes.trim() })
      toast.success(`Booked ${res.data.appointmentId} for ${customer.name}`)
      onBooked?.(res.data)
      onClose()
    } catch (err) {
      setErrors({ server: err.message })
      if (err.status === 409) {
        setSlot('')
        slots.reload()
      }
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'primary.main' }}>Add Appointment</DialogTitle>
      <DialogContent dividers>
        <CustomerPicker value={customer} onChange={(c) => { setCustomer(c); setErrors((e) => ({ ...e, customer: '' })) }} error={Boolean(errors.customer)} helperText={errors.customer} disabled={Boolean(presetCustomer)} />
        <TextField
          select
          label="Therapy"
          value={therapyId}
          onChange={(e) => { setTherapyId(e.target.value); setErrors((er) => ({ ...er, therapy: '' })) }}
          error={Boolean(errors.therapy)}
          helperText={errors.therapy || ' '}
        >
          {(therapies.data || []).map((t) => (
            <MenuItem key={t._id} value={t._id}>{t.name} — {formatCurrency(t.price)}</MenuItem>
          ))}
        </TextField>
        <p className="mb-2 text-sm font-medium">Date</p>
        <DateStrip value={date} onChange={(d) => { setDate(d); setSlot('') }} days={settings.bookingWindowDays} />
        <p className="mb-2 mt-4 text-sm font-medium">Time slot</p>
        <SlotGrid slots={slots.data?.slots} loading={slots.loading} value={slot} onChange={(s) => { setSlot(s); setErrors((e) => ({ ...e, slot: '' })) }} />
        {errors.slot && <p className="mt-1 text-xs text-red-600">{errors.slot}</p>}
        <TextField label="Notes (Optional)" multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 500))} sx={{ mt: 3 }} />
        {errors.server && <Alert severity="error" sx={{ mt: 2 }}>{errors.server}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving}>
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Book Appointment'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// open hone pe hi form mount hota hai — har baar fresh state
const BookingDialog = ({ open, ...props }) => (open ? <BookingForm {...props} /> : null)

export default BookingDialog
