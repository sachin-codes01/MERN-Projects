import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Alert, Checkbox, CircularProgress, Divider, FormControlLabel,
  IconButton, InputAdornment, TextField,
} from '@mui/material'
import { GoogleLogin } from '@react-oauth/google'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useAuth } from '@/context/AuthContext.jsx'
import { BRAND_GRADIENT, BRAND_GRADIENT_HOVER } from '@/constants/theme.js'

// Ek hi illustration - background transparent hai, isliye kisi bhi
// gradient panel ke upar seedha fit ho jaati hai
import loginArt from '@/assets/posters/person-login.png'   // 1672 x 941

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithGoogle, loginWithPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)     // email+password form
  const [googleLoading, setGoogleLoading] = useState(false)

  // ForgotPassword.jsx yahan navigate karte waqt ye state bhejta hai -
  // password badal chuka hai, ab yahin se naye password se login karna hai
  const [resetSuccess, setResetSuccess] = useState(!!location.state?.resetSuccess)

  const busy = loading || googleLoading

  // ==========================================================
  // EMAIL + PASSWORD LOGIN
  // ==========================================================
  const validate = () => {
    const errors = {}

    if (!email.trim()) errors.email = 'Email is required'
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Enter a valid email address'

    if (!password) errors.password = 'Password is required'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setLoading(true)
    try {
      await loginWithPassword(email.trim(), password, rememberMe)
      navigate('/chat', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ==========================================================
  // GOOGLE LOGIN
  // response.credential ek JWT token hai jo Google ne banaya hai
  // ==========================================================
  const handleGoogleSuccess = async (response) => {
    setError('')
    setGoogleLoading(true)

    try {
      // Token backend ko bhejte hain - wahan verify hoga aur user banega/milega
      const user = await loginWithGoogle(response.credential)

      // Pehli baar Google se aaya user - abhi tak koi application
      // password nahi banaya. Seedha chat par nahi, pehle password banane
      // wali screen par bhejte hain
      navigate(user.needsPassword ? '/create-password' : '/chat', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  // ==========================================================
  // Login ka content - desktop aur mobile dono me yahi lagta hai,
  // isliye ek hi jagah likh diya
  // ==========================================================
  const loginBox = (
    <>
      <span className="brand-font block text-4xl sm:text-5xl brand-gradient-text mb-6">
        Vārtālāpaḥ
      </span>

      <p className="plain-text text-xs sm:text-sm tracking-[0.3em] text-brand uppercase font-semibold">
        welcome back
      </p>

      <h1 className="brand-font text-3xl sm:text-4xl lg:text-5xl mt-2 brand-gradient-text">
        Sign in
      </h1>

      <p className="plain-text mt-3 text-xs sm:text-sm text-app-muted leading-relaxed">
        Use your email and password, or continue with Google.
      </p>

      {/* Password abhi-abhi reset hua hai - ForgotPassword.jsx se yahan bheja gaya */}
      {resetSuccess && (
        <Alert severity="success" className="!mt-4 !text-left" onClose={() => setResetSuccess(false)}>
          Password updated. Please log in with your new password.
        </Alert>
      )}

      {/* Error message - login fail hone par */}
      {error && (
        <Alert severity="error" className="!mt-4 !text-left" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* ---------- EMAIL + PASSWORD FORM ---------- */}
      <form onSubmit={handleLogin} noValidate className="mt-6 flex flex-col gap-4 text-left">
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
          onChange={(e) => setPassword(e.target.value)}
          error={!!fieldErrors.password}
          helperText={fieldErrors.password || ' '}
          fullWidth
          size="small"
          disabled={busy}
          autoComplete="current-password"
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

        <div className="flex items-center justify-between -mt-2">
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={busy}
                sx={{ '&.Mui-checked': { color: 'var(--color-brand)' } }}
              />
            }
            label={<span className="text-xs text-app-muted">Remember me</span>}
          />

          <Link to="/forgot-password" className="text-xs text-brand-light hover:underline no-tap-flash">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full text-white font-semibold text-sm py-3 flex items-center justify-center gap-2 shadow-lg shadow-black/20 transition-transform active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
          style={{ background: BRAND_GRADIENT }}
          onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = BRAND_GRADIENT_HOVER }}
          onMouseLeave={(e) => { e.currentTarget.style.background = BRAND_GRADIENT }}
        >
          {loading ? (
            <>
              <CircularProgress size={16} sx={{ color: 'white' }} /> Signing in...
            </>
          ) : (
            'Login'
          )}
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
          // .env me Client ID daali hi nahi to button dikhane ka fayda nahi
          <Alert severity="warning" className="!text-left !text-xs">
            <b>Setup needed:</b> add <code>VITE_GOOGLE_CLIENT_ID</code> to
            client/.env, then restart the dev server.
          </Alert>
        ) : (
          // Google ka official login button
          <div className="rounded-full overflow-hidden shadow-lg shadow-black/30">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed, please try again')}
              theme="outline"
              shape="pill"
              size="large"
              width="280"
            />
          </div>
        )}
      </div>

      {/* Google se to bina koi form bhare hi naya account ban jata hai -
          lekin ye link isliye zaroori hai taaki jo username+password se
          signup karna chahta hai, use ye option turant dikhe, dabi hui
          chhoti si line na ho */}
      <div className="mt-5 pt-4 border-t border-app-border">
        <p className="plain-text text-sm text-app-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-light hover:underline font-semibold">
            Create one
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
    // ==========================================================
    // Full page - koi card/box nahi. Do halve seedhe screen ke
    // poore height/width le lete hain (desktop par side by side,
    // mobile par upar-neeche)
    // ==========================================================
    <div className="min-h-screen w-full bg-app-bg flex flex-col md:flex-row overflow-hidden">
      {/* Illustration half - gradient background, PNG transparent hone ki
          wajah se seedha usi me ghul jaati hai */}
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

      {/* Login form half */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 sm:px-12 md:px-16 lg:px-24">
        <div className="w-full max-w-sm text-center">{loginBox}</div>
      </div>
    </div>
  )
}

export default Login
