import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, CircularProgress, IconButton, InputAdornment, TextField } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useAuth } from '@/context/AuthContext.jsx'
import { BRAND_GRADIENT, BRAND_GRADIENT_HOVER } from '@/constants/theme.js'
import PasswordChecklist from '@/components/ui/PasswordChecklist.jsx'
import { usePasswordRules } from '@/hooks/ui/usePasswordRules.js'

const CreatePassword = () => {
  const navigate = useNavigate()
  const { user, setPassword: savePassword } = useAuth()

  const [password, setPasswordValue] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const results = usePasswordRules(password)
  const allRulesPass = results.every((r) => r.ok)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  const canSubmit = allRulesPass && passwordsMatch && !saving

  const handleSubmit = async (e) => {
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
      await savePassword(password, confirmPassword)
      navigate('/chat', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-app-bg flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <span className="brand-font block text-4xl brand-gradient-text mb-6">
          Vārtālāpaḥ
        </span>

        <p className="plain-text text-xs sm:text-sm tracking-[0.3em] text-brand uppercase font-semibold">
          one last step
        </p>

        <h1 className="brand-font text-3xl sm:text-4xl mt-2 brand-gradient-text">
          Create a password
        </h1>

        <p className="plain-text mt-3 text-xs sm:text-sm text-app-muted leading-relaxed">
          Hi {user?.name?.split(' ')[0] || 'there'}! You signed in with Google. Set an application
          password so you can also log in with just your email - even on a device without your
          Google account.
        </p>

        {error && (
          <Alert severity="error" className="!mt-4 !text-left" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4 text-left">
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
            label="Confirm password"
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
              'Create password & continue'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreatePassword
