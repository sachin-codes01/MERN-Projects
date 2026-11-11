import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import AuthShell from '../components/layout/AuthShell.jsx'
import OtpStep from '../components/common/OtpStep.jsx'
import { authApi } from '../api/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/FeedbackContext.jsx'
import { mobileError, onlyDigits } from '../utils/validators.js'

// Purana customer: mobile number → OTP → dashboard
const Login = () => {
  const { customer, loginCustomer } = useAuth()
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [otpInfo, setOtpInfo] = useState(null) // OTP bhejne ke baad { devOtp, resendIn }
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const redirectTo = location.state?.from?.pathname ? `${location.state.from.pathname}${location.state.from.search || ''}` : '/home'

  if (customer && !otpInfo) return <Navigate to={redirectTo} replace />

  const sendOtp = async (e) => {
    e.preventDefault()
    const err = mobileError(mobile)
    if (err) return setError(err)
    setSending(true)
    try {
      const res = await authApi.sendOtp(mobile, 'login')
      setOtpInfo(res)
      toast.success(res.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const onVerified = (res) => {
    loginCustomer(res.token, res.customer)
    toast.success(res.message)
    navigate(redirectTo, { replace: true })
  }

  return (
    <AuthShell>
      <div className="surface px-6 py-8 sm:px-10">
        {otpInfo ? (
          <OtpStep mobile={mobile} purpose="login" devOtp={otpInfo.devOtp} resendIn={otpInfo.resendIn} onVerified={onVerified} onChangeNumber={() => setOtpInfo(null)} />
        ) : (
          <form onSubmit={sendOtp} noValidate>
            <div className="text-center">
              <h1 className="heading text-3xl">Welcome Back</h1>
              <p className="mt-2 text-sm text-muted">Please enter your registered mobile number to access your profile.</p>
            </div>
            <TextField
              label="Mobile Number"
              value={mobile}
              onChange={(e) => {
                setMobile(onlyDigits(e.target.value))
                setError('')
              }}
              error={Boolean(error)}
              helperText={error || ' '}
              autoFocus
              sx={{ mt: 4 }}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> },
                htmlInput: { inputMode: 'numeric', autoComplete: 'tel-national' },
              }}
            />
            <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 1 }} disabled={sending}>
              {sending ? <CircularProgress size={24} color="inherit" /> : 'Get OTP'}
            </Button>
            <p className="mt-6 text-center text-sm text-muted">
              New to our centre?{' '}
              <Link to="/register" className="font-medium text-brand-700 hover:underline">
                Register Now
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthShell>
  )
}

export default Login
