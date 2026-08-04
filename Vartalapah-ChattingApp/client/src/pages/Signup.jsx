import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Alert, CircularProgress, Divider, IconButton, InputAdornment, TextField,
} from '@mui/material'
import { GoogleLogin } from '@react-oauth/google'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useAuth } from '@/context/AuthContext.jsx'
import { BRAND_GRADIENT, BRAND_GRADIENT_HOVER } from '@/constants/theme.js'
import PasswordChecklist from '@/components/ui/PasswordChecklist.jsx'
import { usePasswordRules } from '@/hooks/ui/usePasswordRules.js'

// Ek hi illustration - Login.jsx wali - dono screens ek hi visual
// language share karti hain
import loginArt from '@/assets/posters/person-login.png'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,20}$/

// ==========================================================
// SIGNUP - do step
//
//   1. DETAILS -> username, email, password, confirm password
//   2. VERIFY  -> usi email ke Google account se sign in karke saabit
//                 karo ki tum SACH ME uske malik ho - warna koi bhi
//                 kisi aur ki email likhkar uske naam account bana leta
//
// Bilkul wahi technique jo ForgotPassword.jsx me hai: pehle email lo,
// phir Google se USI email ko verify karwao. Verify hote hi backend
// account banata hai (aur googleId bhi jod deta hai, taaki aage se
// "Continue with Google" se bhi ye account khul sake)
// ==========================================================
const Signup = () => {
  const navigate = useNavigate()
  const { register, loginWithGoogle } = useAuth()

  const [step, setStep] = useState('details') // 'details' | 'verify'

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPasswordValue] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const busy = verifying || googleLoading

  const results = usePasswordRules(password)
  const allRulesPass = results.every((r) => r.ok)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  // ==========================================================
  // STEP 1 - DETAILS
  // ==========================================================
  const validate = () => {
    const errors = {}

    if (!username.trim()) errors.username = 'Username is required'
    else if (!USERNAME_REGEX.test(username.trim())) {
      errors.username = '3-20 characters: letters, numbers, underscore or dot only'
    }

    if (!email.trim()) errors.email = 'Email is required'
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Enter a valid email address'

    if (!allRulesPass) errors.password = 'Password does not meet the requirements below'

    if (!passwordsMatch) errors.confirmPassword = 'Passwords do not match'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleDetailsSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    // Fields theek hain - ab isi email ka malik hona saabit karna hai
    setEmail(email.trim())
    setStep('verify')
  }

  // ==========================================================
  // STEP 2 - VERIFY EMAIL WITH GOOGLE
  // ==========================================================
  const handleVerifySuccess = async (response) => {
    setError('')
    setVerifying(true)

    try {
      await register(username.trim(), email, password, confirmPassword, response.credential)
      navigate('/chat', { replace: true })
    } catch (err) {
      setError(err.message)

      // "email already exists" / "username taken" / "email doesn't match" -
      // teeno hi kisi field ki galti hai, Google ki nahi. Wapas details
      // par bhej dete hain taaki wo field theek kar sakein
      setStep('details')
    } finally {
      setVerifying(false)
    }
  }

  // ==========================================================
  // GOOGLE SIGN UP (ek-click, password ke bina - alag, normal raasta)
  // Yahi endpoint hai jo Login.jsx use karta hai - naya email ho to
  // account apne aap ban jata hai, purana ho to seedha login
  // ==========================================================
  const handleGoogleSuccess = async (response) => {
    setError('')
    setGoogleLoading(true)

    try {
      const user = await loginWithGoogle(response.credential)
      navigate(user.needsPassword ? '/create-password' : '/chat', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  const signupBox = (
    <>
      <span className="brand-font block text-4xl sm:text-5xl brand-gradient-text mb-6">
        Vārtālāpaḥ
      </span>

      <h1 className="brand-font text-3xl sm:text-4xl lg:text-5xl mt-2 brand-gradient-text">
        Create account
      </h1>

      <p className="plain-text mt-3 text-xs sm:text-sm text-app-muted leading-relaxed">
        {step === 'details'
          ? 'Pick a username and password, or continue with Google.'
          : `Verify ${email} with Google to finish creating your account.`}
      </p>

      {error && (
        <Alert severity="error" className="!mt-4 !text-left" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* ---------- STEP 1: DETAILS ---------- */}
      {step === 'details' && (
        <>
          <form onSubmit={handleDetailsSubmit} noValidate className="mt-6 flex flex-col gap-4 text-left">
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!fieldErrors.username}
              helperText={fieldErrors.username || ' '}
              fullWidth
              size="small"
              disabled={busy}
              autoComplete="username"
              className="no-zoom-input"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon fontSize="small" className="text-app-muted" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email || ' '}
              fullWidth
              size="small"
              disabled={busy}
              autoComplete="email"
              className="no-zoom-input"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon fontSize="small" className="text-app-muted" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPasswordValue(e.target.value)}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password || ' '}
              fullWidth
              size="small"
              disabled={busy}
              autoComplete="new-password"
              className="no-zoom-input"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" className="text-app-muted" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Confirm password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!fieldErrors.confirmPassword}
              helperText={fieldErrors.confirmPassword || ' '}
              fullWidth
              size="small"
              disabled={busy}
              autoComplete="new-password"
              className="no-zoom-input"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" className="text-app-muted" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirm((v) => !v)}
                        edge="end"
                        size="small"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Password type karte hi live dikhta hai - kya missing hai */}
            {password.length > 0 && <PasswordChecklist results={results} />}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full text-white font-semibold text-sm py-3 flex items-center justify-center gap-2 shadow-lg shadow-black/20 transition-transform active:scale-[0.98] disabled:opacity-60 mt-1"
              style={{ background: BRAND_GRADIENT }}
              onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = BRAND_GRADIENT_HOVER }}
              onMouseLeave={(e) => { e.currentTarget.style.background = BRAND_GRADIENT }}
            >
              Continue
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <Divider className="flex-1" />
            <span className="text-[11px] text-app-muted uppercase tracking-widest">or</span>
            <Divider className="flex-1" />
          </div>

          <div className="min-h-[44px] flex items-center justify-center">
            {googleLoading ? (
              <div className="flex items-center gap-3">
                <CircularProgress size={20} />
                <span className="text-sm">Signing in...</span>
              </div>
            ) : !GOOGLE_CLIENT_ID ? (
              <Alert severity="warning" className="!text-left !text-xs">
                <b>Setup needed:</b> add <code>VITE_GOOGLE_CLIENT_ID</code> to
                client/.env, then restart the dev server.
              </Alert>
            ) : (
              <div className="rounded-full overflow-hidden shadow-lg shadow-black/30">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-up failed, please try again')}
                  theme="outline"
                  shape="pill"
                  size="large"
                  width="280"
                  text="signup_with"
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* ---------- STEP 2: VERIFY EMAIL WITH GOOGLE ---------- */}
      {step === 'verify' && (
        <div className="mt-6 flex flex-col items-center gap-4">
          {verifying ? (
            <div className="flex items-center gap-3 min-h-[44px]">
              <CircularProgress size={20} />
              <span className="text-sm">Creating your account...</span>
            </div>
          ) : !GOOGLE_CLIENT_ID ? (
            <Alert severity="warning" className="!text-left !text-xs">
              <b>Setup needed:</b> add <code>VITE_GOOGLE_CLIENT_ID</code> to
              client/.env, then restart the dev server.
            </Alert>
          ) : (
            <div className="rounded-full overflow-hidden shadow-lg shadow-black/30">
              <GoogleLogin
                onSuccess={handleVerifySuccess}
                onError={() => setError('Google verification failed, please try again')}
                theme="outline"
                shape="pill"
                size="large"
                width="280"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => { setStep('details'); setError('') }}
            className="text-xs text-app-muted hover:text-app-text no-tap-flash"
          >
            Change details
          </button>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-app-border">
        <p className="plain-text text-sm text-app-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-light hover:underline font-semibold">
            Log in
          </Link>
        </p>
      </div>

      <Link
        to="/"
        className="mt-5 inline-flex items-center justify-center gap-1 text-sm text-app-muted hover:text-app-text transition-colors"
      >
        <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to home
      </Link>
    </>
  )

  return (
    <div className="min-h-screen w-full bg-app-bg flex flex-col md:flex-row overflow-hidden">
      <div className="relative w-full md:w-1/2 min-h-[32vh] md:min-h-screen bg-linear-to-br from-[#2e1065] via-brand-dark to-brand-light flex items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 rounded-full bg-black/20 blur-3xl" />

        <img
          src={loginArt}
          alt=""
          aria-hidden="true"
          className="relative w-full h-full object-cover object-left select-none pointer-events-none"
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8 sm:px-12 md:px-16 lg:px-24">
        <div className="w-full max-w-sm text-center">{signupBox}</div>
      </div>
    </div>
  )
}

export default Signup
