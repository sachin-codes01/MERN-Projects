import { Link } from 'react-router-dom'
import Button from '@mui/material/Button'
import CheckCircle from '@mui/icons-material/CheckCircle'
import ArrowForward from '@mui/icons-material/ArrowForward'
import AuthShell from '../../components/layout/AuthShell.jsx'
import QrCard from '../../components/common/QrCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

// Registration ke baad: unique Customer ID + QR code (scan karne pe staff ko poori profile milti hai)
const RegisterSuccess = () => {
  const { customer } = useAuth()

  return (
    <AuthShell hideMobileLogo>
      <div className="text-center">
        <CheckCircle sx={{ fontSize: 72 }} className="text-brand-500" />
        <h1 className="heading mt-2 text-4xl">Registration Successful!</h1>
        <p className="mt-1 text-sm text-muted">Your Wellness Profile is Ready</p>
      </div>
      <div className="mt-6">
        <QrCard
          customer={customer}
          actions={
            <Button component={Link} to="/profile" variant="contained" fullWidth>
              View Profile
            </Button>
          }
        />
      </div>
      <div className="mt-5 text-center">
        <Button component={Link} to="/home" endIcon={<ArrowForward />}>
          Continue to Home
        </Button>
      </div>
    </AuthShell>
  )
}

export default RegisterSuccess
