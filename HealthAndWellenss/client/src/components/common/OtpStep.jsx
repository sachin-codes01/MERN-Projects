import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import OtpInput from './OtpInput.jsx'
import { authApi } from '../../api/index.js'
import { useToast } from '../../context/FeedbackContext.jsx'
import { maskMobile } from '../../utils/format.js'

// OTP verify wala hissa — registration aur login dono me same
// devOtp: dev mode me server OTP bhejta hai, wo yahan dikh jaata hai (SMS lagne ke baad nahi aayega)
const OtpStep = ({ mobile, purpose, devOtp: initialDevOtp, resendIn = 30, onVerified, onChangeNumber }) => {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [timer, setTimer] = useState(resendIn)
  const [devOtp, setDevOtp] = useState(initialDevOtp)
  const toast = useToast()

  // Resend button ka countdown
  useEffect(() => {
    if (timer <= 0) return
    const id = setTimeout(() => setTimer((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timer])

  const verify = async (code = otp) => {
    if (verifying) return
    if (code.length !== 6) {
      setError('Please enter the 6-digit OTP')
      return
    }
    setVerifying(true)
    setError('')
    try {
      const res = await authApi.verifyOtp(mobile, purpose, code)
      onVerified(res)
    } catch (err) {
      setError(err.message)
      setOtp('')
    } finally {
      setVerifying(false)
    }
  }

  const resend = async () => {
    setResending(true)
    setError('')
    try {
      const res = await authApi.sendOtp(mobile, purpose)
      setDevOtp(res.devOtp)
      setTimer(res.resendIn || 30)
      setOtp('')
      toast.success(res.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="text-center">
      <h2 className="heading text-3xl">Verify OTP</h2>
      <p className="mt-2 text-sm text-muted">We have sent a 6 digit OTP to</p>
      <p className="font-semibold text-ink">+91 {maskMobile(mobile)}</p>
      <button type="button" onClick={onChangeNumber} className="mt-1 text-xs font-medium text-brand-500 hover:underline">
        Change number
      </button>

      {devOtp && (
        <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
          Test mode: your OTP is <b>{devOtp}</b>
        </Alert>
      )}

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault()
          verify()
        }}
      >
        <OtpInput
          value={otp}
          onChange={(v) => {
            setOtp(v)
            setError('')
          }}
          onComplete={verify}
          error={Boolean(error)}
          disabled={verifying}
        />
        {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}

        <p className="mt-5 text-sm text-muted">
          {timer > 0 ? (
            <>Resend OTP in 00:{String(timer).padStart(2, '0')}</>
          ) : (
            <button type="button" onClick={resend} disabled={resending} className="font-medium text-brand-700 hover:underline disabled:opacity-50">
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </p>

        <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 3 }} disabled={verifying || otp.length !== 6}>
          {verifying ? <CircularProgress size={24} color="inherit" /> : 'Verify'}
        </Button>
      </form>
    </div>
  )
}

export default OtpStep
