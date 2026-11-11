import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Add from '@mui/icons-material/Add'
import { Panel } from '../../components/admin/AdminUi.jsx'
import ReceptionQr from '../../components/admin/ReceptionQr.jsx'
import { ErrorState, Loader } from '../../components/common/Feedback.jsx'
import { staffApi } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/FeedbackContext.jsx'
import { useSettings } from '../../context/SettingsContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { formatDateTime, slotToMinutes } from '../../utils/format.js'
import { emailError } from '../../utils/validators.js'

const SLOT_REGEX = /^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i

// "9:30 am" → "09:30 AM"
const normaliseSlot = (s) => {
  const [, h, m, p] = s.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/)
  return `${h.padStart(2, '0')}:${m} ${p}`
}

// ===== Centre + Booking + Loyalty settings (admin) =====
const CentreSettings = ({ initial, isAdmin }) => {
  const [form, setForm] = useState(initial)
  const [newSlot, setNewSlot] = useState('')
  const [slotError, setSlotError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { reloadSettings } = useSettings()
  const toast = useToast()

  const set = (key, number = false) => (e) => setForm((f) => ({ ...f, [key]: number ? e.target.value.replace(/[^\d.]/g, '') : e.target.value }))

  const addSlot = () => {
    if (!SLOT_REGEX.test(newSlot.trim())) return setSlotError('Use the format 10:00 AM')
    const slot = normaliseSlot(newSlot)
    if (form.timeSlots.includes(slot)) return setSlotError('This slot already exists')
    setForm((f) => ({ ...f, timeSlots: [...f.timeSlots, slot].sort((a, b) => slotToMinutes(a) - slotToMinutes(b)) }))
    setNewSlot('')
    setSlotError('')
  }

  const save = async () => {
    setError('')
    if (!form.centreName.trim()) return setError('Centre name is required')
    if (form.email && emailError(form.email)) return setError('Enter a valid centre email')
    if (!form.timeSlots.length) return setError('Add at least one time slot')
    if (Number(form.goldVisits) <= Number(form.silverVisits)) return setError('Gold visits must be more than Silver visits')
    setSaving(true)
    try {
      const nums = ['slotCapacity', 'bookingWindowDays', 'pointsPerVisit', 'pointValue', 'followUpAfterDays', 'silverVisits', 'goldVisits']
      const body = { ...form }
      nums.forEach((k) => (body[k] = Number(body[k])))
      delete body._id
      delete body.createdAt
      delete body.updatedAt
      delete body.__v
      const res = await staffApi.saveSettings(body)
      setForm(res.data)
      reloadSettings()
      toast.success('Settings saved')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const disabled = !isAdmin

  return (
    <div className="flex flex-col gap-5">
      {!isAdmin && <Alert severity="info">Only admins can change centre settings.</Alert>}
      <Panel title="Centre Details">
        <div className="grid gap-x-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><TextField label="Centre name" value={form.centreName} onChange={set('centreName')} disabled={disabled} helperText=" " /></div>
          <TextField label="Phone" value={form.phone} onChange={set('phone')} disabled={disabled} helperText="Shown on 'Contact the Centre'" />
          <TextField label="WhatsApp number" value={form.whatsapp} onChange={set('whatsapp')} disabled={disabled} helperText=" " />
          <TextField label="Email" value={form.email} onChange={set('email')} disabled={disabled} helperText=" " />
          <TextField label="Opening hours" value={form.openingHours} onChange={set('openingHours')} disabled={disabled} helperText=" " />
          <div className="sm:col-span-2"><TextField label="Address" multiline minRows={2} value={form.address} onChange={set('address')} disabled={disabled} /></div>
        </div>
      </Panel>

      <Panel title="Booking">
        <p className="mb-2 text-sm font-medium">Time slots</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {form.timeSlots.map((s) => (
            <Chip key={s} label={s} onDelete={disabled ? undefined : () => setForm((f) => ({ ...f, timeSlots: f.timeSlots.filter((x) => x !== s) }))} color="primary" variant="outlined" />
          ))}
        </div>
        {!disabled && (
          <div className="mb-4 flex items-start gap-2">
            <TextField size="small" placeholder="e.g. 07:30 PM" value={newSlot} onChange={(e) => { setNewSlot(e.target.value); setSlotError('') }} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSlot())} error={Boolean(slotError)} helperText={slotError || ' '} sx={{ maxWidth: 200 }} />
            <Button variant="outlined" onClick={addSlot} startIcon={<Add />}>Add slot</Button>
          </div>
        )}
        <div className="grid gap-x-4 sm:grid-cols-2">
          <TextField label="Customers per slot" value={form.slotCapacity} onChange={set('slotCapacity', true)} disabled={disabled} helperText="Number of therapists / rooms" />
          <TextField label="Booking window (days)" value={form.bookingWindowDays} onChange={set('bookingWindowDays', true)} disabled={disabled} helperText="How far ahead customers can book" />
        </div>
      </Panel>

      <Panel title="Loyalty & Follow-ups">
        <div className="grid gap-x-4 sm:grid-cols-3">
          <TextField label="Points per visit" value={form.pointsPerVisit} onChange={set('pointsPerVisit', true)} disabled={disabled} helperText=" " />
          <TextField label="Value of 1 point (₹)" value={form.pointValue} onChange={set('pointValue', true)} disabled={disabled} helperText=" " />
          <TextField label="Follow-up after (days)" value={form.followUpAfterDays} onChange={set('followUpAfterDays', true)} disabled={disabled} helperText=" " />
          <TextField label="Silver tier from (visits)" value={form.silverVisits} onChange={set('silverVisits', true)} disabled={disabled} helperText=" " />
          <TextField label="Gold tier from (visits)" value={form.goldVisits} onChange={set('goldVisits', true)} disabled={disabled} helperText=" " />
        </div>
      </Panel>

      {error && <Alert severity="error">{error}</Alert>}
      {isAdmin && (
        <div className="sticky bottom-3 z-10 flex justify-end">
          <Button variant="contained" size="large" onClick={save} disabled={saving} sx={{ boxShadow: 3 }}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Settings'}
          </Button>
        </div>
      )}
    </div>
  )
}

// ===== Staff accounts (admin) =====
const StaffForm = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: '' })) }

  const submit = async () => {
    const e = {}
    if (form.name.trim().length < 2) e.name = 'Name is required'
    const em = emailError(form.email.trim(), true)
    if (em) e.email = em
    if (form.password.length < 8) e.password = 'At least 8 characters'
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      await staffApi.createStaff({ ...form, name: form.name.trim(), email: form.email.trim() })
      toast.success('Staff member added')
      onSaved()
      onClose()
    } catch (err) {
      setErrors({ server: err.message })
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'primary.main' }}>Add Staff</DialogTitle>
      <DialogContent dividers>
        <TextField label="Name" value={form.name} onChange={set('name')} error={Boolean(errors.name)} helperText={errors.name || ' '} />
        <TextField label="Email" type="email" value={form.email} onChange={set('email')} error={Boolean(errors.email)} helperText={errors.email || ' '} />
        <TextField label="Temporary password" type="password" value={form.password} onChange={set('password')} error={Boolean(errors.password)} helperText={errors.password || 'Ask them to change it after first login'} autoComplete="new-password" />
        <TextField select label="Role" value={form.role} onChange={set('role')} sx={{ mt: 2 }} helperText="Admins can change settings, therapies, offers and staff">
          <MenuItem value="staff">Staff</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </TextField>
        {errors.server && <Alert severity="error" sx={{ mt: 2 }}>{errors.server}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving}>{saving ? <CircularProgress size={22} color="inherit" /> : 'Add'}</Button>
      </DialogActions>
    </Dialog>
  )
}

const StaffSettings = () => {
  const { staff: me } = useAuth()
  const { data, loading, error, reload, setData } = useFetch(() => staffApi.staff())
  const [adding, setAdding] = useState(false)
  const toast = useToast()

  const update = async (s, body) => {
    try {
      const res = await staffApi.updateStaff(s._id, body)
      setData((list) => list.map((x) => (x._id === s._id ? res.data : x)))
      toast.success(res.message)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading && !data) return <Loader />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <Panel title="Staff Accounts" action={<Button variant="contained" size="small" startIcon={<Add />} onClick={() => setAdding(true)}>Add Staff</Button>}>
      {data.map((s) => (
        <div key={s._id} className="flex flex-wrap items-center gap-3 border-b border-brand-50 py-3 last:border-0">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{s.name} {s._id === me._id && <span className="text-xs text-muted">(you)</span>}</p>
            <p className="truncate text-xs text-muted">{s.email} · Last login {s.lastLoginAt ? formatDateTime(s.lastLoginAt, true) : 'never'}</p>
          </div>
          <TextField select size="small" value={s.role} onChange={(e) => update(s, { role: e.target.value })} disabled={s._id === me._id} sx={{ width: 110 }}>
            <MenuItem value="staff">Staff</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
          <Tooltip title={s.isActive ? 'Active' : 'Deactivated'}>
            <span><Switch checked={s.isActive} disabled={s._id === me._id} onChange={(e) => update(s, { isActive: e.target.checked })} /></span>
          </Tooltip>
        </div>
      ))}
      {adding && <StaffForm onClose={() => setAdding(false)} onSaved={reload} />}
    </Panel>
  )
}

// ===== My account: password change =====
const AccountSettings = () => {
  const { staff } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: '' })) }

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.currentPassword) errs.currentPassword = 'Enter your current password'
    if (form.newPassword.length < 8) errs.newPassword = 'At least 8 characters'
    else if (form.newPassword === form.currentPassword) errs.newPassword = 'New password must be different'
    if (form.confirm !== form.newPassword) errs.confirm = 'Passwords do not match'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      const res = await staffApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      toast.success(res.message)
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      setErrors({ server: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel title="My Account">
      <p className="mb-4 text-sm text-muted">{staff.name} · {staff.email} · {staff.role === 'admin' ? 'Admin' : 'Staff'}</p>
      <form onSubmit={submit} noValidate className="max-w-sm">
        <TextField label="Current password" type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} error={Boolean(errors.currentPassword)} helperText={errors.currentPassword || ' '} />
        <TextField label="New password" type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} error={Boolean(errors.newPassword)} helperText={errors.newPassword || 'At least 8 characters'} />
        <TextField label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={Boolean(errors.confirm)} helperText={errors.confirm || ' '} sx={{ mt: 1 }} />
        {errors.server && <Alert severity="error" sx={{ mb: 2 }}>{errors.server}</Alert>}
        <Button type="submit" variant="contained" disabled={saving}>{saving ? <CircularProgress size={22} color="inherit" /> : 'Change Password'}</Button>
      </form>
    </Panel>
  )
}

// Settings page: tabs — Centre (sab ke liye view, admin edit), Staff (admin), My Account
const Settings = () => {
  const { staff } = useAuth()
  const isAdmin = staff.role === 'admin'
  const [tab, setTab] = useState('centre')
  const { data, loading, error, reload } = useFetch(() => staffApi.settings())

  return (
    <div>
      <h1 className="heading mb-4 text-3xl sm:text-4xl">Settings</h1>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }} variant="scrollable" allowScrollButtonsMobile>
        <Tab value="centre" label="Centre & Booking" />
        {isAdmin && <Tab value="staff" label="Staff" />}
        <Tab value="reception" label="Reception QR" />
        <Tab value="account" label="My Account" />
      </Tabs>
      {tab === 'centre' && (error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <Loader /> : <CentreSettings initial={data} isAdmin={isAdmin} />)}
      {tab === 'staff' && isAdmin && <StaffSettings />}
      {tab === 'reception' && <ReceptionQr />}
      {tab === 'account' && <AccountSettings />}
    </div>
  )
}

export default Settings
