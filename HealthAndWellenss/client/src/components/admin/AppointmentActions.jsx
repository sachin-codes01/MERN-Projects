import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import MoreVert from '@mui/icons-material/MoreVert'
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlined'
import EventBusy from '@mui/icons-material/EventBusy'
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined'
import PersonOutline from '@mui/icons-material/PersonOutlined'
import EditNoteOutlined from '@mui/icons-material/EditNoteOutlined'
import { staffApi } from '../../api/index.js'
import { useConfirm, useToast } from '../../context/FeedbackContext.jsx'
import { formatDate, todayStr } from '../../utils/format.js'

// Appointment ke "⋮" menu: Complete (therapist naam ke saath), Cancel, No-show, Notes, Customer profile
const AppointmentActions = ({ appointment: a, onUpdated, showCustomerLink = true }) => {
  const [anchor, setAnchor] = useState(null)
  const [dialog, setDialog] = useState(null) // 'complete' | 'notes'
  const [therapist, setTherapist] = useState(a.therapist || '')
  const [notes, setNotes] = useState(a.notes || '')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const confirm = useConfirm()
  const toast = useToast()
  const isScheduled = a.status === 'scheduled'

  const update = async (body) => {
    setSaving(true)
    try {
      const res = await staffApi.updateAppointment(a._id, body)
      toast.success(res.message)
      onUpdated?.(res.data)
      setDialog(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (status) => {
    setAnchor(null)
    const ok = await confirm({
      title: status === 'cancelled' ? 'Cancel this appointment?' : 'Mark as no-show?',
      message: `${a.customer?.name || 'Customer'} · ${a.therapyName} on ${formatDate(a.date)} at ${a.slot}`,
      confirmText: status === 'cancelled' ? 'Cancel appointment' : 'Mark no-show',
      danger: true,
    })
    if (ok) update({ status })
  }

  const open = (name) => {
    setAnchor(null)
    setDialog(name)
  }

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label="Appointment actions">
        <MoreVert fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {isScheduled && a.date <= todayStr() && (
          <MenuItem onClick={() => open('complete')}>
            <ListItemIcon><CheckCircleOutline fontSize="small" color="success" /></ListItemIcon>Mark as completed
          </MenuItem>
        )}
        {isScheduled && (
          <MenuItem onClick={() => changeStatus('no-show')}>
            <ListItemIcon><PersonOffOutlined fontSize="small" /></ListItemIcon>Mark as no-show
          </MenuItem>
        )}
        {isScheduled && (
          <MenuItem onClick={() => changeStatus('cancelled')} sx={{ color: 'error.main' }}>
            <ListItemIcon><EventBusy fontSize="small" color="error" /></ListItemIcon>Cancel appointment
          </MenuItem>
        )}
        <MenuItem onClick={() => open('notes')}>
          <ListItemIcon><EditNoteOutlined fontSize="small" /></ListItemIcon>Therapist & notes
        </MenuItem>
        {showCustomerLink && a.customer?._id && (
          <MenuItem onClick={() => navigate(`/admin/customers/${a.customer._id}`)}>
            <ListItemIcon><PersonOutline fontSize="small" /></ListItemIcon>View customer
          </MenuItem>
        )}
      </Menu>

      <Dialog open={Boolean(dialog)} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'primary.main' }}>
          {dialog === 'complete' ? 'Complete visit' : 'Therapist & notes'}
        </DialogTitle>
        <DialogContent>
          <p className="mb-4 text-sm text-muted">{a.customer?.name} · {a.therapyName} · {a.slot}</p>
          <TextField label="Therapist name" value={therapist} onChange={(e) => setTherapist(e.target.value)} helperText=" " autoFocus />
          <TextField label="Session notes" multiline minRows={3} value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 1000))} />
          {dialog === 'complete' && <p className="mt-3 text-xs text-muted">Loyalty points will be added and a follow-up reminder will be scheduled (if the customer opted in).</p>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            color={dialog === 'complete' ? 'success' : 'primary'}
            disabled={saving}
            onClick={() => update(dialog === 'complete' ? { status: 'completed', therapist: therapist.trim(), notes } : { therapist: therapist.trim(), notes })}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : dialog === 'complete' ? 'Mark completed' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AppointmentActions
