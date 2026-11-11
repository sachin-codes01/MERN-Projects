import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Phone from '@mui/icons-material/Phone'
import WhatsApp from '@mui/icons-material/WhatsApp'
import Email from '@mui/icons-material/Email'
import Place from '@mui/icons-material/Place'
import Schedule from '@mui/icons-material/Schedule'
import { useSettings } from '../../context/SettingsContext.jsx'

// "Contact the Centre" popup — details admin panel ki Settings se aati hain
const ContactDialog = ({ open, onClose }) => {
  const { settings } = useSettings()
  const hasAny = settings.phone || settings.whatsapp || settings.email || settings.address

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'primary.main' }}>Contact the Centre</DialogTitle>
      <DialogContent className="flex flex-col gap-3 pb-6">
        <p className="text-sm font-medium">{settings.centreName}</p>
        {settings.address && (
          <p className="flex gap-2 text-sm text-muted"><Place fontSize="small" /> {settings.address}</p>
        )}
        {settings.openingHours && (
          <p className="flex gap-2 text-sm text-muted"><Schedule fontSize="small" /> {settings.openingHours}</p>
        )}
        <div className="mt-2 flex flex-col gap-2">
          {settings.phone && (
            <Button variant="contained" startIcon={<Phone />} href={`tel:${settings.phone}`}>Call {settings.phone}</Button>
          )}
          {settings.whatsapp && (
            <Button variant="outlined" startIcon={<WhatsApp />} href={`https://wa.me/91${settings.whatsapp.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noreferrer">
              Chat on WhatsApp
            </Button>
          )}
          {settings.email && (
            <Button variant="outlined" startIcon={<Email />} href={`mailto:${settings.email}`}>{settings.email}</Button>
          )}
        </div>
        {!hasAny && <p className="text-sm text-muted">Contact details will be available soon. Please visit the centre.</p>}
      </DialogContent>
    </Dialog>
  )
}

export default ContactDialog
