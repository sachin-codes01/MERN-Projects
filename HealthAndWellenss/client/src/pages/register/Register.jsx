import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import IconButton from '@mui/material/IconButton'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import ArrowBack from '@mui/icons-material/ArrowBack'
import AuthShell from '../../components/layout/AuthShell.jsx'
import OtpStep from '../../components/common/OtpStep.jsx'
import PersonalStep from './PersonalStep.jsx'
import WellnessStep from './WellnessStep.jsx'
import ConsentStep from './ConsentStep.jsx'
import { authApi } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/FeedbackContext.jsx'

const DRAFT_KEY = 'srs_registration_draft'
const STEP_LABELS = ['Personal', 'Wellness', 'Consent']
const STEP_INDEX = { personal: 0, otp: 0, wellness: 1, consent: 2 }

const EMPTY = {
  name: '',
  dob: '',
  mobile: '',
  address: '',
  email: '',
  concern: '',
  bodyArea: '',
  details: '',
  history: '',
  privacy: false,
  followUp: true,
  promotional: false,
}

// Refresh pe form ka data na jaaye isliye sessionStorage me draft (tab band hote hi saaf)
const loadDraft = () => {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY)) || null
  } catch {
    return null
  }
}

// Naya customer: Personal info → OTP → Wellness info → Consent → Success (QR)
const Register = () => {
  const draft = loadDraft()
  const [form, setForm] = useState(draft?.form || EMPTY)
  const [step, setStep] = useState(draft?.step === 'otp' ? 'personal' : draft?.step || 'personal')
  // Kis number ka OTP verify hua aur uska token (30 min valid)
  const [verified, setVerified] = useState(draft?.verified || { mobile: '', token: '' })
  const [otpInfo, setOtpInfo] = useState(null)
  const { customer, loginCustomer } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, verified }))
    } catch {
      // storage band — koi baat nahi
    }
  }, [form, step, verified])

  if (customer && step !== 'consent') return <Navigate to="/home" replace />

  const update = (changes) => setForm((f) => ({ ...f, ...changes }))

  // Step 1 ke baad: number pehle se verify hai to OTP skip, warna OTP bhejo
  const afterPersonal = async () => {
    if (verified.token && verified.mobile === form.mobile) {
      setStep('wellness')
      return
    }
    const res = await authApi.sendOtp(form.mobile, 'register')
    toast.success(res.message)
    setOtpInfo(res)
    setStep('otp')
  }

  const onOtpVerified = (res) => {
    setVerified({ mobile: form.mobile, token: res.registrationToken })
    toast.success('Mobile number verified')
    setStep('wellness')
  }

  const submit = async () => {
    const res = await authApi.register({
      registrationToken: verified.token,
      name: form.name.trim(),
      dob: form.dob,
      address: form.address.trim(),
      email: form.email.trim(),
      wellness: { concern: form.concern, bodyArea: form.bodyArea, details: form.details, history: form.history },
      consent: { privacy: form.privacy, followUp: form.followUp, promotional: form.promotional },
    })
    try {
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignore
    }
    loginCustomer(res.token, res.customer)
    navigate('/register/success', { replace: true })
  }

  // Verification expire ho gaya to wapas OTP pe
  const onVerificationExpired = () => {
    setVerified({ mobile: '', token: '' })
    setStep('personal')
  }

  const goBack = () => {
    if (step === 'personal') navigate('/')
    else if (step === 'otp' || step === 'wellness') setStep('personal')
    else setStep('wellness')
  }

  return (
    <AuthShell maxWidth="max-w-lg" compact>
      <div className="surface px-5 py-6 sm:px-8 sm:py-8">
        <div className="mb-4 flex items-center gap-2">
          <IconButton onClick={goBack} aria-label="Go back" sx={{ ml: -1 }}>
            <ArrowBack />
          </IconButton>
          <p className="text-sm font-medium text-muted">New Customer Registration</p>
        </div>

        {step !== 'otp' && (
          <Stepper activeStep={STEP_INDEX[step]} alternativeLabel sx={{ mb: 4 }}>
            {STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {step === 'personal' && <PersonalStep form={form} update={update} onNext={afterPersonal} />}
        {step === 'otp' && (
          <OtpStep
            mobile={form.mobile}
            purpose="register"
            devOtp={otpInfo?.devOtp}
            resendIn={otpInfo?.resendIn}
            onVerified={onOtpVerified}
            onChangeNumber={() => setStep('personal')}
          />
        )}
        {step === 'wellness' && <WellnessStep form={form} update={update} onBack={() => setStep('personal')} onNext={() => setStep('consent')} />}
        {step === 'consent' && <ConsentStep form={form} update={update} onSubmit={submit} onExpired={onVerificationExpired} onBack={() => setStep('wellness')} />}

        {step === 'personal' && (
          <p className="mt-6 text-center text-sm text-muted">
            Already registered?{' '}
            <Link to="/login" className="font-medium text-brand-700 hover:underline">
              Log in
            </Link>
          </p>
        )}
      </div>
    </AuthShell>
  )
}

export default Register
