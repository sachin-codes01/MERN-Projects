import { useEffect, useRef, useState } from 'react'
import { Alert, CircularProgress, TextField } from '@mui/material'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import { useAuth } from '@/context/AuthContext.jsx'
import { BRAND_GRADIENT, BRAND_GRADIENT_HOVER } from '@/constants/theme.js'

// Backend bhi bilkul yahi do values maanta hai (utils/otp.js) - yahan
// badloge to wahan bhi badalna padega
const CODE_LENGTH = 6
const DEFAULT_RESEND_SECONDS = 60

// ==========================================================
// EMAIL OTP STEP
//
// Ek hi component do jagah chalta hai:
//   Signup.jsx         -> purpose="register"
//   ForgotPassword.jsx -> purpose="reset"
//
// Dono me kaam bilkul same hai - email par 6-digit code bhejo, user se
// wahi code lo, aur verify hone par ek "verification token" parent ko
// de do. Parent us token se apna asli kaam karta hai (account banana
// ya password badalna)
//
// Pehle yahan Google ka <GoogleLogin> button hota tha. Ab Google ki
// zarurat nahi - email khud hi apni malikiyat ka saboot hai
//
// Props:
//   email      - kis email par code bhejna hai (parent pehle hi le chuka)
//   purpose    - 'register' | 'reset'
//   onVerified - (verificationToken) => void, verify hote hi chalta hai
//   onBack     - "wapas jao" wala button. na do to button dikhta hi nahi
//   busy       - parent apna kaam kar raha hai (jaise account ban raha
//                hai) - tab yahan sab kuch disable rakhte hain
// ==========================================================
const EmailOtpStep = ({ email, purpose, onVerified, onBack, backLabel = 'Change email', busy = false }) => {
  const { sendEmailOtp, verifyEmailOtp } = useAuth()

  const [code, setCode] = useState('')
  const [sending, setSending] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Resend button itne second baad hi chalega
  const [cooldown, setCooldown] = useState(DEFAULT_RESEND_SECONDS)

  // React 18 StrictMode development me har effect ko DO BAAR chalata hai.
  // Bina is guard ke page khulte hi do mail chale jate (aur doosra to
  // backend ke 60-second cooldown se 429 khata)
  const hasSentRef = useRef(false)

  const disabled = busy || sending || verifying

  // ==========================================================
  // CODE BHEJNA
  // ==========================================================
  const sendCode = async (isResend = false) => {
    setError('')
    setNotice('')
    setSending(true)

    try {
      const data = await sendEmailOtp(email, purpose)

      setNotice(
        isResend
          ? `New code sent to ${email}`
          : `We sent a ${CODE_LENGTH}-digit code to ${email}`
      )
      setCooldown(data.resendAfter || DEFAULT_RESEND_SECONDS)
    } catch (err) {
      // 429 do bilkul alag wajah se aata hai, aur dono ka matlab ulta hai:
      //
      //   per-email cooldown -> code JA CHUKA hai, bas 60 second ruko.
      //                          Server retryAfter bhi bhejta hai
      //   per-IP rate limit  -> code GAYA HI NAHI (bahut zyada requests).
      //                          Yahan retryAfter nahi hota
      //
      // Isi retryAfter se dono ko alag karte hain. Pehle dono ko ek
      // maan liya tha - natija ye ki rate limit par bhi "code bhej diya"
      // wala hara message dikhta tha, aur user code ka intezaar karta
      // rehta jo kabhi aaya hi nahi
      const retryAfter = err.data?.retryAfter
      const isCooldown = err.status === 429 && retryAfter > 0

      // Step par pehli baar aate hi cooldown mila? Matlab code pehle hi
      // ja chuka hai (user abhi abhi yahan hokar wapas aaya hai) - ye
      // galti nahi hai, isliye laal error ki jagah normal notice dikhate
      // hain. Resend par cooldown lage to error dikhana sahi hai, kyunki
      // wahan user ne khud button dabaya hai
      if (isCooldown && !isResend) {
        setNotice(`We already sent a code to ${email}. Please check your inbox.`)
      } else {
        setError(err.message)
      }

      // Baaki errors par resend turant khol dete hain taaki user phansa na rahe
      setCooldown(isCooldown ? retryAfter : 0)
    } finally {
      setSending(false)
    }
  }

  // Step khulte hi pehla code apne aap chala jata hai - user ko ek
  // extra "Send code" button dabane ki zarurat nahi
  //
  // Dependency array jaan-boojhkar khali hai: ye SIRF mount par chalna
  // chahiye. sendCode har render par naya function hota hai, use
  // dependency me daalte hi har render par ek naya mail chala jata
  useEffect(() => {
    if (hasSentRef.current) return
    hasSentRef.current = true

    sendCode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Har second countdown ghatata hai. 0 par pahunchte hi interval khud
  // band ho jata hai (cleanup) - background me chalta nahi rehta
  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setInterval(() => {
      setCooldown((seconds) => (seconds <= 1 ? 0 : seconds - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  // ==========================================================
  // CODE VERIFY KARNA
  //
  // value alag se leta hai kyunki auto-submit (6th digit type hote hi)
  // ke waqt state abhi update nahi hui hoti - setState turant nahi
  // dikhta, isliye seedha nayi value bhejte hain
  // ==========================================================
  const verifyCode = async (value) => {
    if (value.length !== CODE_LENGTH || verifying) return

    setError('')
    setNotice('')
    setVerifying(true)

    try {
      const data = await verifyEmailOtp(email, value, purpose)
      onVerified(data.verificationToken)
    } catch (err) {
      setError(err.message)
      // Galat code screen par pada rehne se agli koshish me confusion
      // hoti hai - saaf karke cursor wapas de dete hain
      setCode('')
    } finally {
      setVerifying(false)
    }
  }

  const handleChange = (e) => {
    // Sirf digits. Log aksar "123 456" ya "123-456" copy karke laate
    // hain - saara kachra yahin nikal dete hain, error dikhane se behtar
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH)

    setCode(cleaned)
    if (error) setError('')

    // Poora code ho gaya to khud hi verify - user ko button dhundhna hi na pade
    if (cleaned.length === CODE_LENGTH) verifyCode(cleaned)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    verifyCode(code)
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {notice && !error && (
        <div className="flex items-center justify-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1.5">
          <MarkEmailReadOutlinedIcon sx={{ fontSize: 15 }} />
          {notice}
        </div>
      )}

      {error && (
        <Alert severity="error" className="!text-left" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="6-digit code"
          value={code}
          onChange={handleChange}
          fullWidth
          size="small"
          disabled={disabled}
          autoFocus
          autoComplete="one-time-code"
          className="no-zoom-input"
          slotProps={{
            htmlInput: {
              // inputMode="numeric" se mobile par seedha number wala
              // keyboard khulta hai (type="number" jaan-boojhkar nahi -
              // wo up/down arrows aur scroll se value badal deta hai)
              inputMode: 'numeric',
              maxLength: CODE_LENGTH,
              style: { textAlign: 'center', letterSpacing: '0.6em', fontSize: '1.1rem', fontWeight: 600 },
            },
          }}
          helperText={
            busy
              ? ' '
              : sending
                ? 'Sending code...'
                : "Can't find it? Check your spam folder."
          }
        />

        <button
          type="submit"
          disabled={disabled || code.length !== CODE_LENGTH}
          className="w-full rounded-full text-white font-semibold text-sm py-3 flex items-center justify-center gap-2 shadow-lg shadow-black/20 transition-transform active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
          style={{ background: BRAND_GRADIENT }}
          onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = BRAND_GRADIENT_HOVER }}
          onMouseLeave={(e) => { e.currentTarget.style.background = BRAND_GRADIENT }}
        >
          {verifying || busy ? (
            <>
              <CircularProgress size={16} sx={{ color: 'white' }} /> Verifying...
            </>
          ) : (
            'Verify email'
          )}
        </button>
      </form>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => sendCode(true)}
          disabled={disabled || cooldown > 0}
          className="text-xs text-brand-light hover:underline disabled:text-app-muted disabled:no-underline disabled:cursor-default no-tap-flash"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className="text-xs text-app-muted hover:text-app-text no-tap-flash"
          >
            {backLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export default EmailOtpStep
