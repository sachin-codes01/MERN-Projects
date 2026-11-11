import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Avatar from '@mui/material/Avatar'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import SpaOutlined from '@mui/icons-material/SpaOutlined'
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import MoreHoriz from '@mui/icons-material/MoreHoriz'
import PersonOutline from '@mui/icons-material/PersonOutlined'
import HistoryOutlined from '@mui/icons-material/HistoryOutlined'
import AlarmOutlined from '@mui/icons-material/AlarmOutlined'
import WorkspacePremiumOutlined from '@mui/icons-material/WorkspacePremiumOutlined'
import Logout from '@mui/icons-material/Logout'
import Phone from '@mui/icons-material/Phone'
import Logo from '../brand/Logo.jsx'
import NotificationBell from '../common/NotificationBell.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useConfirm, useToast } from '../../context/FeedbackContext.jsx'
import { useSettings } from '../../context/SettingsContext.jsx'
import { initials } from '../../utils/format.js'

// Desktop navbar ke links
const YEAR = new Date().getFullYear()

const NAV = [
  { to: '/home', label: 'Home' },
  { to: '/therapies', label: 'Therapies' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/history', label: 'Visit History' },
  { to: '/loyalty', label: 'Offers' },
]

// Mobile ke neeche wali tab bar (image jaisa: Home, Therapies, Appointments, More)
const BOTTOM = [
  { to: '/home', label: 'Home', icon: <HomeOutlined /> },
  { to: '/therapies', label: 'Therapies', icon: <SpaOutlined /> },
  { to: '/appointments', label: 'Appointments', icon: <EventNoteOutlined /> },
  { to: '/more', label: 'More', icon: <MoreHoriz />, match: ['/more', '/history', '/reminders', '/loyalty', '/profile', '/rate'] },
]

// Customer side ka common dhaancha: upar navbar, beech me page, mobile pe neeche tab bar
const CustomerLayout = () => {
  const { customer, logoutCustomer } = useAuth()
  const { settings } = useSettings()
  const [menuAnchor, setMenuAnchor] = useState(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const toast = useToast()

  const bottomValue = BOTTOM.findIndex((b) => (b.match || [b.to]).some((p) => pathname.startsWith(p)))

  const go = (to) => {
    setMenuAnchor(null)
    navigate(to)
  }

  const logout = async () => {
    setMenuAnchor(null)
    const ok = await confirm({ title: 'Log out?', message: 'You can log in again anytime with your mobile number.', confirmText: 'Log out' })
    if (!ok) return
    logoutCustomer()
    toast.info('You have been logged out')
    navigate('/')
  }

  return (
    <div className="customer-site flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-brand-100 bg-cream">
        <div className="mx-auto flex min-h-28 max-w-6xl items-center gap-4 px-4">
          <Link to={customer ? '/home' : '/'} aria-label="Home">
            <Logo size="sm" />
          </Link>

          <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
            {customer &&
              NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    `border-b px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'border-brand-700 text-brand-700' : 'border-transparent text-muted hover:text-brand-700'}`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {customer ? (
              <>
                <NotificationBell role="customer" />
                <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="Account menu" sx={{ p: 0.5 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>{initials(customer.name)}</Avatar>
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <div className="px-4 py-2">
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-xs text-muted">{customer.customerId}</p>
                  </div>
                  <Divider />
                  <MenuItem onClick={() => go('/profile')}>
                    <ListItemIcon><PersonOutline fontSize="small" /></ListItemIcon>My Profile
                  </MenuItem>
                  <MenuItem onClick={() => go('/reminders')}>
                    <ListItemIcon><AlarmOutlined fontSize="small" /></ListItemIcon>Follow-ups & Reminders
                  </MenuItem>
                  <MenuItem onClick={() => go('/history')}>
                    <ListItemIcon><HistoryOutlined fontSize="small" /></ListItemIcon>Visit History
                  </MenuItem>
                  <MenuItem onClick={() => go('/loyalty')}>
                    <ListItemIcon><WorkspacePremiumOutlined fontSize="small" /></ListItemIcon>Loyalty & Offers
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={logout} sx={{ color: 'error.main' }}>
                    <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>Log out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button component={Link} to="/login" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  Log in
                </Button>
                <Button component={Link} to="/register" variant="contained">
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={`mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-12 ${customer ? 'pb-28 lg:pb-10' : ''}`}>
        <Outlet />
      </main>

      <footer className="hidden border-t border-brand-100 bg-cream lg:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-muted">
          <p>© {YEAR} {settings.centreName}</p>
          <div className="flex flex-wrap items-center gap-4">
            {settings.openingHours && <span>{settings.openingHours}</span>}
            {settings.phone && (
              <a href={`tel:${settings.phone}`} className="flex items-center gap-1 text-brand-700 hover:underline">
                <Phone fontSize="inherit" /> {settings.phone}
              </a>
            )}
          </div>
        </div>
      </footer>

      {customer && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-100 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
          <BottomNavigation showLabels value={bottomValue} onChange={(_, i) => navigate(BOTTOM[i].to)}>
            {BOTTOM.map((b) => (
              <BottomNavigationAction key={b.to} label={b.label} icon={b.icon} sx={{ minWidth: 0 }} />
            ))}
          </BottomNavigation>
        </nav>
      )}
    </div>
  )
}

export default CustomerLayout
