import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined'
import AuthShell from '../../components/layout/AuthShell.jsx'
import { staffApi } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/FeedbackContext.jsx'
import { emailError } from '../../utils/validators.js'

// Staff / Admin login (email + password)
const AdminLogin = () => {
  const { staff, loginStaff } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const redirectTo = location.state?.from?.pathname || '/admin'

  if (staff) return <Navigate to={redirectTo} replace />

  const change = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: '', server: '' }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    const em = emailError(form.email.trim(), true)
    if (em) errs.email = em
    if (!form.password) errs.password = 'Password is required'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    try {
      const res = await staffApi.login(form.email.trim(), form.password)
      loginStaff(res.token, res.staff)
      toast.success(res.message)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setErrors({ server: err.message })
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <form onSubmit={submit} noValidate className="surface px-6 py-8 sm:px-10">
        <div className="text-center">
          <AdminPanelSettingsOutlined sx={{ fontSize: 44 }} className="text-brand-500" />
          <h1 className="heading mt-1 text-3xl">Staff Login</h1>
          <p className="mt-1 text-sm text-muted">Staff & Administrator Dashboard</p>
        </div>
        {errors.server && <Alert severity="error" sx={{ mt: 3 }}>{errors.server}</Alert>}
        <TextField label="Email" type="email" autoComplete="username" value={form.email} onChange={change('email')} error={Boolean(errors.email)} helperText={errors.email || ' '} sx={{ mt: 3 }} autoFocus />
        <TextField
          label="Password"
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          value={form.password}
          onChange={change('password')}
          error={Boolean(errors.password)}
          helperText={errors.password || ' '}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShow((s) => !s)} edge="end" aria-label={show ? 'Hide password' : 'Show password'}>
                    {show ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 1 }} disabled={loading}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Log in'}
        </Button>
        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-brand-700 hover:underline">← Back to website</Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default AdminLogin
