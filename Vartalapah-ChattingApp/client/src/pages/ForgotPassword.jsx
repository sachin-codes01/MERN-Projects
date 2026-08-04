import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, CircularProgress, IconButton, InputAdornment, TextField } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import { useAuth } from '@/context/AuthContext.jsx'
import { BRAND_GRADIENT, BRAND_GRADIENT_HOVER } from '@/constants/theme.js'
import PasswordChecklist from '@/components/ui/PasswordChecklist.jsx'
import EmailOtpStep from '@/components/auth/EmailOtpStep.jsx'
import { usePasswordRules } from '@/hooks/ui/usePasswordRules.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ==========================================================
// FORGOT PASSWORD - teen step
//
//   1. EMAIL     -> pehle apna email batao (required). Isi se pata
//                   chalta hai account hai bhi ya nahi
//   2. CODE      -> usi email par 6-digit code bhejte hain, wahi code
//                   wapas maangte hain. Code inbox me hi aata hai,
//                   isliye sahi code bata dena hi saboot hai ki email
//                   tumhari hai
//   3. PASSWORD  -> ab naya password banao
//
// Signup bhi bilkul yahi karta hai - dono ek hi EmailOtpStep component
// use karte hain, bas purpose alag hota hai ('reset' vs 'register')
// ==========================================================
const ForgotPassword = () => {
  const navigate = useNavigate()
  const { checkEmail, resetPassword } = useAuth()

  const [step, setStep] = useState('email') // 'email' | 'code' | 'password'

  // ---- STEP 1 ----
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [checkingEmail, setCheckingEmail] = useState(false)

  // ---- STEP 2 ----
  // Code verify hone par mila token - Step 3 me yahi backend ko jata hai
  const [verificationToken, setVerificationToken] = useState(null)

  // ---- STEP 3 ----
  const [password, setPasswordValue] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')

  const results = usePasswordRules(password)
  const allRulesPass = results.every((r) => r.ok)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const canSubmit = allRulesPass && passwordsMatch && !saving

  // ==========================================================
  // STEP 1 - EMAIL (required)
  // ==========================================================
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEmailError('')

    const cleanEmail = email.trim()

    if (!cleanEmail) {
      setEmailError('Email is required')
      return
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setEmailError('Enter a valid email address')
      return
    }

    setCheckingEmail(true)
    try {
      const { exists } = await checkEmail(cleanEmail)

      if (!exists) {
        setError(
          <>
            No account found for {cleanEmail}. Please{' '}
            <Link to="/login" className="underline font-medium">sign in with the correct email</Link>, or{' '}
            <Link to="/signup" className="underline font-medium">create an account</Link>.
          </>
        )
        return
      }

      // Account chahe Google se bana ho ya seedha username+password se
      // signup kiya ho - dono ke liye ye kaam karta hai. Agle step me
      // isi email par code bhejte hain
      setEmail(cleanEmail)
      setStep('code')
    } catch (err) {
      setError(err.message)
    } finally {
      setCheckingEmail(false)
    }
  }

  // ==========================================================
  // STEP 2 - CODE VERIFY HO CHUKA
  // EmailOtpStep khud hi code bhejta aur check karta hai - yahan sirf
  // uska diya hua token sambhal kar agle step par chale jate hain
  // ==========================================================
  const handleVerified = (token) => {
    setError('')
    setVerificationToken(token)
    setStep('password')
  }

  // ==========================================================
  // STEP 3 - NEW PASSWORD
  // ==========================================================
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!allRulesPass) {
      setError('Please meet all password requirements below')
      return
    }
    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      await resetPassword(verificationToken, password, confirmPassword)

      // Yahan seedha chat par nahi bhejte - login page par bhejte hain,
      // taaki user apne NAYE password se khud login kare (aur wahan
      // "Continue with Google" bilkul alag, normal button hai - is
      // reset flow se uska koi lena dena nahi)
      navigate('/login', { replace: true, state: { resetSuccess: true } })
    } catch (err) {
      setError(err.message)
      // Token 15 minute me expire ho jata hai - fail hone ki sabse
      // aam wajah yahi hai. Wapas code wale step par bhej dete hain,
      // jahan naya code mangwaya ja sake
      setVerificationToken(null)
      setStep('code')
    } finally {
      setSaving(false)
    }
  }

  const stepSubtitle = {
    email: "First tell us which account you're trying to recover.",
    code: `We'll email a 6-digit code to ${email} to make sure it's really you.`,
    password: 'Identity verified. Choose a new password for your account.',
  }[step]

  return (
    <div className="min-h-screen w-full bg-app-bg flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <span className="brand-font block text-4xl brand-gradient-text mb-6">
          Vārtālāpaḥ
        </span>

        <p className="plain-text text-xs sm:text-sm tracking-[0.3em] text-brand uppercase font-semibold">
          reset password
        </p>

        <h1 className="brand-font text-3xl sm:text-4xl mt-2 brand-gradient-text">
          Forgot your password?
        </h1>

        <p className="plain-text mt-3 text-xs sm:text-sm text-app-muted leading-relaxed">
          {stepSubtitle}
        </p>

        {error && (
          <Alert severity="error" className="!mt-4 !text-left" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* ---------- STEP 1: EMAIL ---------- */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} noValidate className="mt-6 flex flex-col gap-4 text-left">
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError || ' '}
              required
              fullWidth
              size="small"
              disabled={checkingEmail}
              autoComplete="email"
              autoFocus
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

            <button
              type="submit"
              disabled={checkingEmail}
              className="w-full rounded-full text-white font-semibold text-sm py-3 flex items-center justify-center gap-2 shadow-lg shadow-black/20 transition-transform active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
              style={{ background: BRAND_GRADIENT }}
              onMouseEnter={(e) => { if (!checkingEmail) e.currentTarget.style.background = BRAND_GRADIENT_HOVER }}
              onMouseLeave={(e) => { e.currentTarget.style.background = BRAND_GRADIENT }}
            >
              {checkingEmail ? (
                <>
                  <CircularProgress size={16} sx={{ color: 'white' }} /> Checking...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        )}

        {/* ---------- STEP 2: EMAIL CODE ---------- */}
        {step === 'code' && (
          <EmailOtpStep
            email={email}
            purpose="reset"
            onVerified={handleVerified}
            onBack={() => { setStep('email'); setError('') }}
            backLabel="Wrong email? Go back"
          />
        )}

        {/* ---------- STEP 3: NEW PASSWORD ---------- */}
        {step === 'password' && (
          <>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1.5">
              <VerifiedUserOutlinedIcon sx={{ fontSize: 15 }} />
              Verified as {email}
            </div>

            <form onSubmit={handlePasswordSubmit} noValidate className="mt-5 flex flex-col gap-4 text-left">
              <TextField
                label="New password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPasswordValue(e.target.value)}
                fullWidth
                size="small"
                disabled={saving}
                autoComplete="new-password"
                autoFocus
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
                label="Confirm new password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={confirmPassword.length > 0 && !passwordsMatch}
                helperText={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : ' '}
                fullWidth
                size="small"
                disabled={saving}
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

              <PasswordChecklist results={results} />

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-full text-white font-semibold text-sm py-3 flex items-center justify-center gap-2 shadow-lg shadow-black/20 transition-transform active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 mt-1"
                style={{ background: BRAND_GRADIENT }}
                onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.background = BRAND_GRADIENT_HOVER }}
                onMouseLeave={(e) => { e.currentTarget.style.background = BRAND_GRADIENT }}
              >
                {saving ? (
                  <>
                    <CircularProgress size={16} sx={{ color: 'white' }} /> Saving...
                  </>
                ) : (
                  'Reset password'
                )}
              </button>
            </form>
          </>
        )}

        <Link
          to="/login"
          className="mt-6 inline-flex items-center justify-center gap-1 text-sm text-app-muted hover:text-app-text transition-colors"
        >
          <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to login
        </Link>
      </div>
    </div>
  )
}

export default ForgotPassword
