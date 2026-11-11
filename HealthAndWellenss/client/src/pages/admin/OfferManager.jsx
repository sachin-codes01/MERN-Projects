import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Add from '@mui/icons-material/Add'
import EditOutlined from '@mui/icons-material/EditOutlined'
import DeleteOutline from '@mui/icons-material/DeleteOutlined'
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined'
import { EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx'
import { staffApi } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useConfirm, useToast } from '../../context/FeedbackContext.jsx'
import { useSettings } from '../../context/SettingsContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { addDays, formatDate, todayStr } from '../../utils/format.js'

const EMPTY = { title: '', description: '', discountPercent: 10, validTill: addDays(todayStr(), 30), minTier: 'Bronze', oncePerCustomer: true, isActive: true }

// Offer add/edit popup
const OfferForm = ({ offer, onClose, onSaved }) => {
  const [form, setForm] = useState(offer || EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
    setErrors((er) => ({ ...er, [key]: '' }))
  }

  const submit = async () => {
    const e = {}
    if (form.title.trim().length < 3) e.title = 'Title must be at least 3 characters'
    const pct = Number(form.discountPercent)
    if (!pct || pct < 1 || pct > 90) e.discountPercent = 'Between 1 and 90'
    if (!form.validTill) e.validTill = 'Select an end date'
    else if (!offer && form.validTill < todayStr()) e.validTill = 'End date cannot be in the past'
    setErrors(e)
    if (Object.keys(e).length) return

    setSaving(true)
    const body = { ...form, title: form.title.trim(), description: form.description.trim(), discountPercent: pct }
    try {
      const res = offer ? await staffApi.updateOffer(offer._id, body) : await staffApi.createOffer(body)
      toast.success(offer ? res.message : 'Offer created — customers who opted in have been notified')
      onSaved()
      onClose()
    } catch (err) {
      setErrors({ server: err.message })
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'primary.main' }}>{offer ? 'Edit Offer' : 'New Offer'}</DialogTitle>
      <DialogContent dividers>
        <TextField label="Offer title" placeholder="10% off on your next therapy" value={form.title} onChange={set('title')} error={Boolean(errors.title)} helperText={errors.title || ' '} />
        <TextField label="Description (Optional)" value={form.description} onChange={set('description')} helperText=" " />
        <div className="grid gap-x-3 sm:grid-cols-3">
          <TextField label="Discount" type="number" value={form.discountPercent} onChange={set('discountPercent')} error={Boolean(errors.discountPercent)} helperText={errors.discountPercent || ' '} slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }, htmlInput: { min: 1, max: 90 } }} />
          <TextField label="Valid till" type="date" value={form.validTill} onChange={set('validTill')} error={Boolean(errors.validTill)} helperText={errors.validTill || ' '} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField select label="Minimum tier" value={form.minTier} onChange={set('minTier')} helperText=" ">
            {['Bronze', 'Silver', 'Gold'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </div>
        <div className="flex flex-col">
          <FormControlLabel control={<Switch checked={form.oncePerCustomer} onChange={set('oncePerCustomer')} />} label="Each customer can use it only once" />
          <FormControlLabel control={<Switch checked={form.isActive} onChange={set('isActive')} />} label="Active" />
        </div>
        {errors.server && <Alert severity="error" sx={{ mt: 2 }}>{errors.server}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving}>{saving ? <CircularProgress size={22} color="inherit" /> : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  )
}

// Loyalty rules (summary) + offers list
const OfferManager = () => {
  const { staff } = useAuth()
  const isAdmin = staff.role === 'admin'
  const { settings } = useSettings()
  const { data, loading, error, reload, setData } = useFetch(() => staffApi.offers())
  const [editing, setEditing] = useState(null)
  const confirm = useConfirm()
  const toast = useToast()
  const today = todayStr()

  const remove = async (o) => {
    if (!(await confirm({ title: `Delete "${o.title}"?`, confirmText: 'Delete', danger: true }))) return
    try {
      await staffApi.deleteOffer(o._id)
      setData((list) => list.filter((x) => x._id !== o._id))
      toast.success('Offer deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="heading text-3xl sm:text-4xl">Loyalty & Offers</h1>
        {isAdmin && <Button variant="contained" startIcon={<Add />} onClick={() => setEditing({})}>New Offer</Button>}
      </div>

      <section className="surface mb-5 grid gap-4 p-5 sm:grid-cols-4">
        <div><p className="text-xs text-muted">Points per visit</p><p className="text-xl font-semibold">{settings.pointsPerVisit}</p></div>
        <div><p className="text-xs text-muted">Point value</p><p className="text-xl font-semibold">₹{settings.pointValue}</p></div>
        <div><p className="text-xs text-muted">Silver from</p><p className="text-xl font-semibold">{settings.silverVisits} visits</p></div>
        <div><p className="text-xs text-muted">Gold from</p><p className="text-xl font-semibold">{settings.goldVisits} visits</p></div>
        {isAdmin && <p className="text-xs text-muted sm:col-span-4">Change these rules in Settings → Loyalty.</p>}
      </section>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data ? (
        <ListSkeleton rows={3} />
      ) : data?.length === 0 ? (
        <EmptyState icon={<LocalOfferOutlined />} title="No offers yet" message="Create an offer to reward your loyal customers." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data?.map((o) => {
            const expired = o.validTill < today
            return (
              <article key={o._id} className={`surface flex items-center gap-4 p-4 ${!o.isActive || expired ? 'opacity-60' : ''}`}>
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gold-300 bg-gold-100/50 text-gold-700">
                  <span className="text-xl font-bold leading-none">{o.discountPercent}%</span>
                  <span className="text-[10px] font-medium">OFF</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{o.title}</p>
                  <p className="text-xs text-muted">Till {formatDate(o.validTill)} · {o.minTier}+ · {o.oncePerCustomer ? 'once per customer' : 'unlimited'}</p>
                  <div className="mt-1 flex gap-1">
                    {expired ? <Chip size="small" label="Expired" /> : o.isActive ? <Chip size="small" color="success" variant="outlined" label="Active" /> : <Chip size="small" label="Paused" />}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex flex-col">
                    <IconButton size="small" onClick={() => setEditing(o)} aria-label="Edit offer"><EditOutlined fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => remove(o)} aria-label="Delete offer"><DeleteOutline fontSize="small" /></IconButton>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {editing && <OfferForm offer={editing._id ? editing : null} onClose={() => setEditing(null)} onSaved={reload} />}
    </div>
  )
}

export default OfferManager
