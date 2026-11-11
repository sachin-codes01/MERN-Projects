import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import ExpandMore from '@mui/icons-material/ExpandMore'
import PersonOutline from '@mui/icons-material/PersonOutlined'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import TuneOutlined from '@mui/icons-material/TuneOutlined'
import ShieldOutlined from '@mui/icons-material/ShieldOutlined'
import HelpOutline from '@mui/icons-material/HelpOutlineOutlined'
import Logout from '@mui/icons-material/Logout'
import QrCard from '../../components/common/QrCard.jsx'
import ContactDialog from '../../components/common/ContactDialog.jsx'
import { TierChip } from '../../components/common/StatusChip.jsx'
import { customerApi } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useConfirm, useToast } from '../../context/FeedbackContext.jsx'
import { BODY_AREAS, CONCERNS } from '../../config.js'
import { formatDateTime, initials, todayStr } from '../../utils/format.js'
import { dobError, emailError, nameError } from '../../utils/validators.js'

const Section = ({ icon, title, children, defaultExpanded = false }) => (
  <Accordion defaultExpanded={defaultExpanded} disableGutters elevation={0} sx={{ mb: 1.5, backgroundColor: 'transparent', borderRadius: '0 !important', border: 0, borderTop: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
    <AccordionSummary expandIcon={<ExpandMore />}>
      <span className="flex items-center gap-3 font-medium text-ink">
        <span className="text-brand-500">{icon}</span>
        {title}
      </span>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
)

// My Profile: QR card, personal/wellness info edit, consent preferences, help, logout
const Profile = () => {
  const { customer, setCustomer, logoutCustomer } = useAuth()
  const [personal, setPersonal] = useState({ name: customer.name, dob: customer.dob, email: customer.email || '', address: customer.address })
  const [wellness, setWellness] = useState({ ...customer.wellness })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState('')
  const [contactOpen, setContactOpen] = useState(false)
  const navigate = useNavigate()
  const confirm = useConfirm()
  const toast = useToast()

  const save = async (section, body) => {
    setSaving(section)
    try {
      const res = await customerApi.updateMe(body)
      setCustomer(res.data)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving('')
    }
  }

  const savePersonal = (e) => {
    e.preventDefault()
    const errs = Object.fromEntries(
      Object.entries({
        name: nameError(personal.name),
        dob: dobError(personal.dob),
        email: emailError(personal.email),
        address: personal.address.trim().length < 5 ? 'Please enter your full address' : '',
      }).filter(([, v]) => v),
    )
    setErrors(errs)
    if (!Object.keys(errs).length) save('personal', { ...personal, name: personal.name.trim(), address: personal.address.trim() })
  }

  const field = (key) => ({
    value: personal[key],
    onChange: (e) => {
      setPersonal((p) => ({ ...p, [key]: e.target.value }))
      if (errors[key]) setErrors((er) => ({ ...er, [key]: '' }))
    },
    error: Boolean(errors[key]),
    helperText: errors[key] || ' ',
  })

  const logout = async () => {
    if (await confirm({ title: 'Log out?', message: 'You can log in again anytime with your mobile number.', confirmText: 'Log out' })) {
      logoutCustomer()
      toast.info('You have been logged out')
      navigate('/')
    }
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-32 lg:self-start">
        <div className="flex flex-col items-center py-5 text-center">
          <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: 26 }}>{initials(customer.name)}</Avatar>
          <h1 className="heading mt-3 text-3xl">{customer.name}</h1>
          <p className="text-sm tracking-wide text-muted">{customer.customerId}</p>
          <div className="mt-2"><TierChip tier={customer.tier} /></div>
        </div>
        <QrCard customer={customer} />
      </aside>

      <div>
        <h2 className="heading mb-4 text-3xl">My Profile</h2>

        <Section icon={<PersonOutline />} title="Personal Information" defaultExpanded>
          <form onSubmit={savePersonal} noValidate className="grid gap-x-4 [&>*]:min-w-0 sm:grid-cols-2">
            <TextField label="Full Name" {...field('name')} />
            <TextField label="Date of Birth" type="date" {...field('dob')} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayStr() } }} />
            <TextField
              label="Mobile Number"
              value={customer.mobile}
              disabled
              helperText="Contact the centre to change your number"
              slotProps={{ input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> } }}
            />
            <TextField label="Email" type="email" {...field('email')} />
            <div className="sm:col-span-2">
              <TextField label="Address" multiline minRows={2} {...field('address')} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="contained" disabled={saving === 'personal'}>
                {saving === 'personal' ? <CircularProgress size={22} color="inherit" /> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Section>

        <Section icon={<FavoriteBorder />} title="Wellness Information">
          <div className="grid gap-x-4 sm:grid-cols-2">
            <TextField select label="Main concern" value={wellness.concern} onChange={(e) => setWellness((w) => ({ ...w, concern: e.target.value }))} helperText=" ">
              {[...new Set([...CONCERNS, wellness.concern])].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField select label="Body area" value={wellness.bodyArea} onChange={(e) => setWellness((w) => ({ ...w, bodyArea: e.target.value }))} helperText=" ">
              {[...new Set([...BODY_AREAS, wellness.bodyArea])].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
            <div className="sm:col-span-2">
              <TextField label="Details" multiline minRows={2} value={wellness.details || ''} onChange={(e) => setWellness((w) => ({ ...w, details: e.target.value.slice(0, 500) }))} helperText=" " />
              <TextField label="Medical history" multiline minRows={2} value={wellness.history || ''} onChange={(e) => setWellness((w) => ({ ...w, history: e.target.value.slice(0, 500) }))} helperText=" " />
            </div>
          </div>
          <Button variant="contained" disabled={saving === 'wellness'} onClick={() => save('wellness', { wellness })}>
            {saving === 'wellness' ? <CircularProgress size={22} color="inherit" /> : 'Save Changes'}
          </Button>
        </Section>

        <Section icon={<TuneOutlined />} title="Consent Preferences">
          <div className="flex flex-col gap-1">
            <FormControlLabel
              control={<Switch checked={Boolean(customer.consent?.followUp)} disabled={Boolean(saving)} onChange={(e) => save('consent', { consent: { followUp: e.target.checked } })} />}
              label={<span className="text-sm">Follow-up messages (WhatsApp/SMS)</span>}
            />
            <FormControlLabel
              control={<Switch checked={Boolean(customer.consent?.promotional)} disabled={Boolean(saving)} onChange={(e) => save('consent', { consent: { promotional: e.target.checked } })} />}
              label={<span className="text-sm">Promotional offers</span>}
            />
          </div>
        </Section>

        <Section icon={<ShieldOutlined />} title="Privacy">
          <p className="text-sm leading-relaxed text-muted">
            You accepted our Privacy Policy on {formatDateTime(customer.consent?.acceptedAt || customer.createdAt)}. Your health
            details are visible only to authorised centre staff. To update or delete your data, please contact the centre.
          </p>
        </Section>

        <Section icon={<HelpOutline />} title="Help & Support">
          <p className="mb-3 text-sm text-muted">Have a question about your appointment or therapy? We're happy to help.</p>
          <Button variant="outlined" onClick={() => setContactOpen(true)}>Contact the Centre</Button>
        </Section>

        <Button color="error" variant="outlined" startIcon={<Logout />} fullWidth size="large" onClick={logout} sx={{ mt: 2 }}>
          Logout
        </Button>
      </div>
      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}

export default Profile
