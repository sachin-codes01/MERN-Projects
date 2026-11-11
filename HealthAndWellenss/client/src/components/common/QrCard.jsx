import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import Button from '@mui/material/Button'
import Download from '@mui/icons-material/Download'
import { useSettings } from '../../context/SettingsContext.jsx'
import { useToast } from '../../context/FeedbackContext.jsx'
import { downloadQrCard, scanUrl } from '../../utils/downloads.js'

const QrCard = ({ customer, actions }) => {
  const canvasRef = useRef(null)
  const { settings } = useSettings()
  const toast = useToast()

  const save = () => {
    downloadQrCard(canvasRef.current, customer, settings.centreName)
    toast.success('Wellness card saved to your device')
  }

  return (
    <div className="surface mx-auto w-full max-w-xs overflow-hidden">
      <div className="flex flex-col items-center gap-3 px-6 pb-5 pt-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-700">Customer ID</p>
        <p className="-mt-2 text-lg font-semibold tracking-wide text-ink">{customer.customerId}</p>
        <div className="rounded-2xl border border-gold-300 bg-white p-3">
          <QRCodeCanvas
            ref={canvasRef}
            value={scanUrl(customer.customerId)}
            size={176}
            level="M"
            fgColor="#143522"
            marginSize={1}
            title={`QR code for ${customer.customerId}`}
          />
        </div>
        <p className="font-serif text-2xl font-semibold text-brand-700">{customer.name}</p>
        <p className="-mt-2 text-xs text-muted">Show this QR at the centre for quick check-in</p>
      </div>
      <div className="flex flex-col gap-2 border-t border-brand-100 bg-brand-50/50 p-4">
        {actions}
        <Button variant="outlined" startIcon={<Download />} onClick={save} fullWidth>
          Save to Wallet
        </Button>
      </div>
    </div>
  )
}

export default QrCard
