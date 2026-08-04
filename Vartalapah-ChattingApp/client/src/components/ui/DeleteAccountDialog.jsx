import { useEffect, useState } from 'react'
import {
  Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, TextField,
} from '@mui/material'
import { useBackGuard } from '@/hooks/ui/useBackGuard.js'

// Backend bhi yahi do values maanta hai (server/utils/otp.js)
const CODE_LENGTH = 6
const RESEND_SECONDS = 60

// ==========================================================
// DELETE ACCOUNT DIALOG
//
// ConfirmDialog ("pakka delete karna hai?") ke BAAD aata hai. Wahan
// haan dabate hi email par 6-digit code chala jata hai, aur account
// tabhi mitta hai jab wahi code yahan bhara jaye
//
// Alag component isliye ki ConfirmDialog jaan-boojhkar bilkul saada
// hai - sirf sawaal aur do button. Usme input, error, countdown sab
// ghusa dete to har jagah ka confirm bhaari ho jata
//
// Props:
//   step      - null = band. warna { sending, error }
//   email     - kis inbox me code gaya (screen par dikhane ke liye)
//   onConfirm - (code) => void
//   onResend  - naya code mangwao
//   onCancel  - dabba band karo, account waisa hi rahega
// ==========================================================
const DeleteAccountDialog = ({ step, email, onConfirm, onResend, onCancel }) => {
  const isOpen = !!step
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(RESEND_SECONDS)

  useBackGuard(isOpen, onCancel)

  // Dabba khulte hi purana code aur countdown reset - warna pichli
  // koshish ka adhoora code agli baar screen par pada milta hai
  useEffect(() => {
    if (!isOpen) return

    setCode('')
    setCooldown(RESEND_SECONDS)
  }, [isOpen])

  // 0 par pahunchte hi interval khud band (cleanup) - background me
  // chalta nahi rehta
  useEffect(() => {
    if (!isOpen || cooldown <= 0) return

    const timer = setInterval(() => {
      setCooldown((seconds) => (seconds <= 1 ? 0 : seconds - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, cooldown])

  const busy = !!step?.sending
  const isComplete = code.length === CODE_LENGTH

  // Sirf digits. Log aksar "123 456" copy karke laate hain
  const handleChange = (e) => {
    setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))
  }

  const handleResend = () => {
    setCode('')
    setCooldown(RESEND_SECONDS)
    onResend()
  }

  // Enter dabane par bhi chale - form ke andar hone se mobile keyboard
  // par "Go" button bhi kaam karta hai
  const handleSubmit = (e) => {
    e.preventDefault()
    if (isComplete && !busy) onConfirm(code)
  }

  return (
    <Dialog open={isOpen} onClose={busy ? undefined : onCancel} fullWidth maxWidth="xs">
      <DialogTitle>Confirm account deletion</DialogTitle>

      <form onSubmit={handleSubmit} noValidate>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            We sent a {CODE_LENGTH}-digit code to <strong>{email}</strong>. Enter it
            below to delete your account. This cannot be undone.
          </DialogContentText>

          {step?.error && (
            <Alert severity="error" sx={{ mb: 2 }}>{step.error}</Alert>
          )}

          <TextField
            label="6-digit code"
            value={code}
            onChange={handleChange}
            fullWidth
            size="small"
            autoFocus
            disabled={busy}
            autoComplete="one-time-code"
            className="no-zoom-input"
            slotProps={{
              htmlInput: {
                // inputMode numeric: mobile par number keyboard khulta hai.
                // type="number" jaan-boojhkar nahi - wo scroll/arrow se
                // value badal deta hai
                inputMode: 'numeric',
                maxLength: CODE_LENGTH,
                style: { textAlign: 'center', letterSpacing: '0.6em', fontSize: '1.1rem', fontWeight: 600 },
              },
            }}
            helperText={busy ? ' ' : "Can't find it? Check your spam folder."}
          />

          <Button
            type="button"
            onClick={handleResend}
            disabled={busy || cooldown > 0}
            size="small"
            sx={{ mt: 1 }}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </Button>
        </DialogContent>

        <DialogActions>
          <Button onClick={onCancel} disabled={busy} sx={{ minHeight: 44 }}>Cancel</Button>

          <Button
            type="submit"
            color="error"
            variant="contained"
            disabled={busy || !isComplete}
            sx={{ minHeight: 44 }}
          >
            {busy
              ? <><CircularProgress size={16} sx={{ color: 'white', mr: 1 }} /> Deleting...</>
              : 'Delete account'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default DeleteAccountDialog
