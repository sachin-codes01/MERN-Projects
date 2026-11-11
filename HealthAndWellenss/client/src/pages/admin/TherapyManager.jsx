import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import useMediaQuery from '@mui/material/useMediaQuery'
import Add from '@mui/icons-material/Add'
import EditOutlined from '@mui/icons-material/EditOutlined'
import DeleteOutline from '@mui/icons-material/DeleteOutlined'
import TherapyImage from '../../components/common/TherapyImage.jsx'
import TherapyPhotos from '../../components/admin/TherapyPhotos.jsx'
import { validImageUrl } from '../../utils/therapyImages.js'
import { ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx'
import { staffApi } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useConfirm, useToast } from '../../context/FeedbackContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { durationLabel, formatCurrency } from '../../utils/format.js'

const EMPTY = { name: '', description: '', price: '', durationMin: '', durationMax: '', areas: '', image: '', images: ['', '', '', ''], order: 0, isActive: true }

const validate = (f) => {
  const e = {}
  if (f.name.trim().length < 3) e.name = 'Name must be at least 3 characters'
  if (f.description.trim().length < 10) e.description = 'Please write a short description (10+ characters)'
  if (f.price === '' || Number(f.price) < 0) e.price = 'Enter a valid price'
  if (!f.durationMin || Number(f.durationMin) < 5) e.durationMin = 'Min 5 minutes'
  if (!f.durationMax || Number(f.durationMax) < Number(f.durationMin)) e.durationMax = 'Must be ≥ minimum'
  if (f.image && !validImageUrl(f.image.trim())) e.image = 'Enter a valid cover image URL'
  if (f.images.some(url => url.trim() && !validImageUrl(url.trim()))) e.images = 'Please correct the gallery image URLs'
  return e
}

// Therapy add/edit form (popup)
const TherapyForm = ({ therapy, onClose, onSaved }) => {
  const [form, setForm] = useState(therapy ? { ...therapy, areas: therapy.areas.join(', '), images: [...(therapy.images || []), ...Array(Math.max(0, 4 - (therapy.images || []).length)).fill('')] } : EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fullScreen = useMediaQuery('(max-width:640px)')
  const toast = useToast()

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
    setErrors((er) => ({ ...er, [key]: '' }))
  }

  const submit = async () => {
    if (uploading || saving) return
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      durationMin: Number(form.durationMin),
      durationMax: Number(form.durationMax),
      areas: form.areas,
      image: form.image.trim(),
      images: [...new Set(form.images.map(url => url.trim()).filter(Boolean))],
      order: Number(form.order) || 0,
      isActive: form.isActive,
    }
    try {
      const res = therapy ? await staffApi.updateTherapy(therapy._id, body) : await staffApi.createTherapy(body)
      toast.success(res.message)
      onSaved()
      onClose()
    } catch (err) {
      setErrors({ server: err.message })
      setSaving(false)
    }
  }

  const err = (key) => ({ error: Boolean(errors[key]), helperText: errors[key] || ' ' })

  return (
    <Dialog open onClose={saving || uploading ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'primary.main' }}>{therapy ? 'Edit Therapy' : 'Add Therapy'}</DialogTitle>
      <DialogContent dividers>
        <TextField label="Therapy name" value={form.name} onChange={set('name')} {...err('name')} />
        <TextField label="Description" multiline minRows={3} value={form.description} onChange={set('description')} {...err('description')} />
        <div className="grid grid-cols-3 gap-3">
          <TextField label="Price" type="number" value={form.price} onChange={set('price')} {...err('price')} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> }, htmlInput: { min: 0 } }} />
          <TextField label="Min mins" type="number" value={form.durationMin} onChange={set('durationMin')} {...err('durationMin')} slotProps={{ htmlInput: { min: 5 } }} />
          <TextField label="Max mins" type="number" value={form.durationMax} onChange={set('durationMax')} {...err('durationMax')} slotProps={{ htmlInput: { min: 5 } }} />
        </div>
        <TextField label="Areas addressed" placeholder="Neck, Shoulders, Back" value={form.areas} onChange={set('areas')} helperText="Separate with commas" />
        <TherapyPhotos image={form.image} images={form.images} onChange={changes => setForm(f => ({ ...f, ...changes }))} onBusyChange={setUploading} disabled={saving} />
        {(errors.image || errors.images) && <Alert severity="error">{errors.image || errors.images}</Alert>}
        <div className="flex flex-wrap items-center gap-4">
          <TextField label="Display order" type="number" value={form.order} onChange={set('order')} sx={{ width: 140 }} helperText="Lower shows first" />
          <FormControlLabel control={<Switch checked={form.isActive} onChange={set('isActive')} />} label="Visible on website" />
        </div>
        {errors.server && <Alert severity="error" sx={{ mt: 2 }}>{errors.server}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving || uploading} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving || uploading}>{saving ? <CircularProgress size={22} color="inherit" /> : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  )
}

// Therapy management — admin add/edit/hide/delete kar sakta hai, staff sirf dekh sakta hai
const TherapyManager = () => {
  const { staff } = useAuth()
  const isAdmin = staff.role === 'admin'
  const { data, loading, error, reload, setData } = useFetch(() => staffApi.therapies())
  const [editing, setEditing] = useState(null) // null = band, {} = naya, therapy = edit
  const confirm = useConfirm()
  const toast = useToast()

  const toggleActive = async (t) => {
    setData((list) => list.map((x) => (x._id === t._id ? { ...x, isActive: !t.isActive } : x)))
    try {
      await staffApi.updateTherapy(t._id, { isActive: !t.isActive })
      toast.success(!t.isActive ? `${t.name} is now visible` : `${t.name} is now hidden`)
    } catch (err) {
      toast.error(err.message)
      reload()
    }
  }

  const remove = async (t) => {
    const ok = await confirm({ title: `Delete ${t.name}?`, message: 'This cannot be undone. Therapies with bookings can only be hidden.', confirmText: 'Delete', danger: true })
    if (!ok) return
    try {
      await staffApi.deleteTherapy(t._id)
      setData((list) => list.filter((x) => x._id !== t._id))
      toast.success('Therapy deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="heading text-3xl sm:text-4xl">Therapy Management</h1>
          <p className="text-sm text-muted">{isAdmin ? 'Add, edit or hide therapies shown on the website' : 'View only — ask an admin to make changes'}</p>
        </div>
        {isAdmin && <Button variant="contained" startIcon={<Add />} onClick={() => setEditing({})}>Add Therapy</Button>}
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data ? (
        <ListSkeleton rows={6} height={80} />
      ) : (
        <div className="surface overflow-hidden">
          {data?.map((t) => (
            <div key={t._id} className={`flex items-center gap-3 border-b border-brand-50 px-3 py-3 last:border-0 sm:px-4 ${t.isActive ? '' : 'bg-slate-50'}`}>
              <TherapyImage therapy={t} className={`h-14 w-14 shrink-0 rounded-xl ${t.isActive ? '' : 'opacity-50 grayscale'}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.name} {!t.isActive && <span className="text-xs font-normal text-muted">(hidden)</span>}</p>
                <p className="text-xs text-muted">{formatCurrency(t.price)} · {durationLabel(t)} · {t.bookings} booking{t.bookings === 1 ? '' : 's'}</p>
              </div>
              {isAdmin && (
                <>
                  <Tooltip title={t.isActive ? 'Visible on website' : 'Hidden'}>
                    <Switch checked={t.isActive} onChange={() => toggleActive(t)} size="small" />
                  </Tooltip>
                  <IconButton size="small" onClick={() => setEditing(t)} aria-label={`Edit ${t.name}`}><EditOutlined fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => remove(t)} aria-label={`Delete ${t.name}`} color="error"><DeleteOutline fontSize="small" /></IconButton>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && <TherapyForm therapy={editing._id ? editing : null} onClose={() => setEditing(null)} onSaved={reload} />}
    </div>
  )
}

export default TherapyManager
