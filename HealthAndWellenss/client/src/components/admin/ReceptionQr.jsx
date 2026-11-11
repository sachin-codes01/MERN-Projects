import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Download from '@mui/icons-material/Download'
import { Panel } from './AdminUi.jsx'
import { useSettings } from '../../context/SettingsContext.jsx'

const ReceptionQr = () => {
  const { settings } = useSettings()
  const [address, setAddress] = useState(window.location.origin)
  const canvas = useRef(null)
  let url = ''
  let local = false
  try {
    const parsed = new URL(address)
    if (['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password) {
      url = new URL('/check-in', parsed.origin).href
      local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
    }
  } catch { /* Show validation below. */ }
  const download = () => {
    if (!canvas.current || !url || local) return
    const a = document.createElement('a')
    a.download = 'centre-check-in-qr.png'
    a.href = canvas.current.toDataURL('image/png')
    a.click()
  }
  return <Panel title="Reception QR / Customer Check-in">
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
      <div><p className="mb-5 max-w-xl text-sm leading-7 text-muted">Place this QR at reception. New customers can register, and returning customers can retrieve their profile using their registered mobile number. Every customer also receives a separate personal QR card.</p>
        <TextField label="Customer website address" value={address} onChange={e => setAddress(e.target.value)} error={!url} helperText={!url ? 'Enter a valid http or https website address' : 'Use the deployed website address, or a reachable LAN address for testing.'} />
        {local && <Alert severity="warning" sx={{ mt: 2 }}>This address works only on this PC. A customer phone needs a deployed website URL, or a reachable PC network address on the same Wi-Fi. Download is enabled after replacing localhost.</Alert>}
        <Alert severity="info" sx={{ mt: 2 }}>WhatsApp/SMS delivery requires a messaging provider. The current app supports in-app reminders and staff follow-up links.</Alert>
        {url && <p className="mt-4 break-all text-xs text-muted">QR destination: {url}</p>}
        <Button variant="contained" startIcon={<Download />} disabled={!url || local} onClick={download} sx={{ mt: 3 }}>Download reception QR</Button>
      </div>
      <div className="flex flex-col items-center gap-4 bg-white p-6 text-center"><p className="heading text-2xl">{settings.centreName}</p>{url && <QRCodeCanvas ref={canvas} value={url} size={220} level="M" marginSize={4} fgColor="#143522" title="Scan to register or access your wellness profile" style={{ maxWidth: '100%', height: 'auto' }} />}<p className="text-sm font-medium">Scan to register or log in</p><p className="text-xs text-muted">New visit. Same care. Your own wellness profile.</p></div>
    </div>
  </Panel>
}
export default ReceptionQr
