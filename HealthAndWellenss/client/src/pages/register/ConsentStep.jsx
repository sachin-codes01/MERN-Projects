import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined'
import { useSettings } from '../../context/SettingsContext.jsx'

// Step 3: privacy consent — privacy wala zaroori, baaki do optional
const ConsentStep = ({ form, update, onSubmit, onExpired, onBack }) => {
  const [policyOpen, setPolicyOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { settings } = useSettings()

  const submit = async (e) => {
    e.preventDefault()
    if (!form.privacy) {
      setError('Please accept the Privacy Policy and Terms to continue')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSubmit()
    } catch (err) {
      setError(err.message)
      if (err.status === 401) setTimeout(onExpired, 1500)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="mb-2 flex items-center gap-2 text-brand-700">
        <VerifiedUserOutlined />
        <h2 className="heading text-2xl">Your Privacy Matters</h2>
      </div>
      <p className="mb-5 text-sm leading-relaxed text-muted">
        We collect this information to provide better care and personalise your experience. Your health details are
        visible only to our centre staff and are never shared.
      </p>

      <div className="flex flex-col gap-2 rounded-xl border border-brand-100 bg-brand-50/40 p-3">
        <FormControlLabel
          control={<Checkbox checked={form.privacy} onChange={(e) => { update({ privacy: e.target.checked }); setError('') }} />}
          label={
            <span className="text-sm">
              I agree to the{' '}
              <button type="button" onClick={() => setPolicyOpen(true)} className="font-medium text-brand-700 underline">
                Privacy Policy and Terms & Conditions
              </button>{' '}
              <span className="text-red-600">*</span>
            </span>
          }
        />
        <FormControlLabel
          control={<Checkbox checked={form.followUp} onChange={(e) => update({ followUp: e.target.checked })} />}
          label={<span className="text-sm">I consent to receive follow-up messages (WhatsApp/SMS)</span>}
        />
        <FormControlLabel
          control={<Checkbox checked={form.promotional} onChange={(e) => update({ promotional: e.target.checked })} />}
          label={<span className="text-sm">I would like to receive promotional offers <span className="text-muted">(Optional)</span></span>}
        />
      </div>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      <div className="mt-6 flex gap-3">
      <Button type="button" variant="outlined" size="large" onClick={onBack} disabled={loading} sx={{ flex: 1 }}>
        Back
      </Button>
      <Button type="submit" variant="contained" size="large" sx={{ flex: 2 }} disabled={loading}>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
      </Button>
      </div>

      <Dialog open={policyOpen} onClose={() => setPolicyOpen(false)} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'primary.main' }}>Privacy Policy & Terms</DialogTitle>
        <DialogContent dividers className="space-y-3 text-sm leading-relaxed text-muted">
          <p><b>What we collect:</b> your name, date of birth, mobile number, address, email (optional) and the wellness details you share.</p>
          <p><b>Why:</b> to understand your concerns, recommend suitable therapies, manage your appointments and send follow-ups you agree to.</p>
          <p><b>Who can see it:</b> only authorised staff of {settings.centreName}. We never sell or share your data with third parties.</p>
          <p><b>Your choices:</b> you can change your message preferences anytime from My Profile, or ask the centre to update or delete your data.</p>
          <p><b>Terms:</b> therapies are not a substitute for medical treatment. Please inform your therapist about any medical condition before your session.</p>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              update({ privacy: true })
              setError('')
              setPolicyOpen(false)
            }}
          >
            I Agree
          </Button>
        </DialogActions>
      </Dialog>
    </form>
  )
}

export default ConsentStep
