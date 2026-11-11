import { Link } from 'react-router-dom'
import Button from '@mui/material/Button'
import AuthShell from '../components/layout/AuthShell.jsx'

// Galat URL khulne pe
const NotFound = () => (
  <AuthShell>
    <div className="surface px-6 py-10 text-center">
      <p className="font-serif text-7xl font-bold text-gold-500">404</p>
      <h1 className="heading mt-2 text-3xl">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The page you are looking for does not exist or has been moved.</p>
      <Button component={Link} to="/" variant="contained" sx={{ mt: 4 }}>
        Back to Home
      </Button>
    </div>
  </AuthShell>
)

export default NotFound
