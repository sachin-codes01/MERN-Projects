import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, CircularProgress } from '@mui/material'
import { GoogleLogin } from '@react-oauth/google'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useAuth } from '../context/AuthContext.jsx'

// Ek hi illustration - background transparent hai, isliye kisi bhi
// gradient panel ke upar seedha fit ho jaati hai
import loginArt from '../assets/posters/person-login.png'   // 1672 x 941

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const Login = () => {
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuth()

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Google login successful hone par ye chalta hai
  // response.credential ek JWT token hai jo Google ne banaya hai
  const handleSuccess = async (response) => {
    setError('')
    setLoading(true)

    try {
      // Token backend ko bhejte hain - wahan verify hoga aur user banega/milega
      await loginWithGoogle(response.credential)

      // Login ke baad chat page par bhej do
      navigate('/chat', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ==========================================================
  // Login ka content - desktop aur mobile dono me yahi lagta hai,
  // isliye ek hi jagah likh diya
  // ==========================================================
  const loginBox = (
    <>
      <span className="brand-font block text-4xl sm:text-5xl brand-gradient-text mb-8">
        Vārtālāpaḥ
      </span>

      <p className="plain-text text-xs sm:text-sm tracking-[0.3em] text-brand uppercase font-semibold">
        welcome back
      </p>

      <h1 className="brand-font text-3xl sm:text-4xl lg:text-5xl mt-2 brand-gradient-text">
        Sign in
      </h1>

      <p className="plain-text mt-3 text-xs sm:text-sm text-app-muted leading-relaxed">
        Use your Google account to start chatting. Nothing to set up, and no
        password to remember.
      </p>

      {/* Error message - login fail hone par */}
      {error && (
        <Alert severity="error" className="!mt-4 !text-left" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="mt-6 min-h-[44px] flex items-center justify-center">
        {loading ? (
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
          // "outline" theme (white pill) daayein taraf ke dark panel par
          // "filled_black" se kaafi zyada contrast karta hai
          <div className="rounded-full overflow-hidden shadow-lg shadow-black/30">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setError('Google login failed, please try again')}
              theme="outline"
              shape="pill"
              size="large"
              width="280"
            />
          </div>
        )}
      </div>

      <p className="plain-text mt-4 text-[11px] text-app-muted">
        Free · Your password never leaves Google
      </p>

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
      <div className="relative w-full md:w-1/2 min-h-[38vh] md:min-h-screen bg-linear-to-br from-[#2e1065] via-brand-dark to-brand-light flex items-center justify-center overflow-hidden">
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
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-12 md:px-16 lg:px-24">
        <div className="w-full max-w-sm text-center">{loginBox}</div>
      </div>
    </div>
  )
}

export default Login
