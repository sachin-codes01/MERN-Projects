import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Button from '@mui/material/Button'
import QrCode2 from '@mui/icons-material/QrCode2'
import AuthShell from '../components/layout/AuthShell.jsx'
import { ErrorState, Loader } from '../components/common/Feedback.jsx'
import { publicApi, staffApi } from '../api/index.js'
import { useAuth } from '../context/AuthContext.jsx'

// QR scan hone pe yahan aate hain:
// staff logged in → customer ki poori profile, customer khud → apni profile, baaki → sirf naam + ID
const Scan = () => {
  const { customerId } = useParams()
  const { staff, customer, ready } = useAuth()
  const [result, setResult] = useState(null)
  const isOwn = customer?.customerId === customerId.toUpperCase()

  useEffect(() => {
    if (!ready.staff || !ready.customer || isOwn) return
    const lookup = staff
      ? staffApi.customerByCode(customerId).then((res) => ({ adminId: res.data._id }))
      : publicApi.scan(customerId).then((res) => ({ info: res.data }))
    lookup.then(setResult).catch((err) => setResult({ error: err.message }))
  }, [customerId, staff, ready.staff, ready.customer, isOwn])

  if (isOwn) return <Navigate to="/profile" replace />
  if (result?.adminId) return <Navigate to={`/admin/customers/${result.adminId}`} replace />
  if (!result) return <Loader full label="Reading QR code..." />

  return (
    <AuthShell>
      <div className="surface px-6 py-8 text-center">
        {result.error ? (
          <ErrorState message={result.error} />
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
              <QrCode2 />
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gold-700">Registered Customer</p>
            <h1 className="heading mt-1 text-3xl">{result.info.displayName}</h1>
            <p className="mt-1 font-medium tracking-wide">{result.info.customerId}</p>
            <p className="mt-4 text-sm text-muted">Health details are private. Centre staff can log in to view the full profile.</p>
            <Button component={Link} to="/login" state={{ from: { pathname: `/scan/${customerId}` } }} variant="outlined" fullWidth sx={{ mt: 3 }}>Customer Login</Button>
            <Button component={Link} to="/admin/login" state={{ from: { pathname: `/scan/${customerId}` } }} variant="contained" fullWidth sx={{ mt: 4 }}>
              Staff Login
            </Button>
          </>
        )}
        <Button component={Link} to="/" sx={{ mt: 2 }}>
          Go to Home
        </Button>
      </div>
    </AuthShell>
  )
}

export default Scan
