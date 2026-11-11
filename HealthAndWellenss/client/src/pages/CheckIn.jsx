import { Link, Navigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import ArrowForward from '@mui/icons-material/ArrowForward'
import AuthShell from '../components/layout/AuthShell.jsx'
import { Loader } from '../components/common/Feedback.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const CheckIn = () => {
  const { customer, ready } = useAuth()
  if (!ready.customer) return <Loader full />
  if (customer) return <Navigate to="/profile" replace />
  return <AuthShell>
    <p className="eyebrow">Welcome to the centre</p>
    <h1 className="heading mt-4 text-5xl">Your wellness journey starts here.</h1>
    <p className="mt-5 text-sm leading-7 text-muted">New here? Create your wellness profile once. Visiting again? Sign in with the same mobile number to see your saved details and previous visits.</p>
    <div className="mt-8 divide-y divide-brand-200 border-y border-brand-200">
      <section className="py-6"><p className="eyebrow">01 / First visit</p><h2 className="heading mt-2 text-3xl">New Customer</h2><p className="mt-2 text-sm text-muted">Share your details and concern. Receive your own unique Customer ID and QR card.</p><Button component={Link} to="/register" variant="contained" endIcon={<ArrowForward />} sx={{ mt: 3 }} fullWidth>Register with mobile OTP</Button></section>
      <section className="py-6"><p className="eyebrow">02 / Welcome back</p><h2 className="heading mt-2 text-3xl">Already Visited Us?</h2><p className="mt-2 text-sm text-muted">Use your registered mobile number. No need to fill the form again.</p><Button component={Link} to="/login" state={{ from: { pathname: '/profile' } }} variant="outlined" endIcon={<ArrowForward />} sx={{ mt: 3 }} fullWidth>Log in &amp; view my profile</Button></section>
    </div>
    <Button component={Link} to="/therapies" endIcon={<ArrowForward />} fullWidth sx={{ mt: 3 }}>Explore Our Therapies</Button>
  </AuthShell>
}
export default CheckIn
