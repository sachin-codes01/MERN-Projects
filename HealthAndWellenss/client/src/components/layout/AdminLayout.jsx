import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import MenuIcon from '@mui/icons-material/Menu'
import Search from '@mui/icons-material/Search'
import Logout from '@mui/icons-material/Logout'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import PeopleOutline from '@mui/icons-material/PeopleOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import SpaOutlined from '@mui/icons-material/SpaOutlined'
import AlarmOutlined from '@mui/icons-material/AlarmOutlined'
import StarOutline from '@mui/icons-material/StarBorder'
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined'
import InsightsOutlined from '@mui/icons-material/InsightsOutlined'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import Logo from '../brand/Logo.jsx'
import NotificationBell from '../common/NotificationBell.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useConfirm } from '../../context/FeedbackContext.jsx'
import { initials } from '../../utils/format.js'

const WIDTH = 252

// Sidebar menu — adminOnly wale staff ko nahi dikhte
const MENU = [
  { to: '/admin', label: 'Dashboard', icon: <DashboardOutlined />, end: true },
  { to: '/admin/customers', label: 'Customers', icon: <PeopleOutline /> },
  { to: '/admin/appointments', label: 'Appointments', icon: <CalendarMonthOutlined /> },
  { to: '/admin/therapies', label: 'Therapies', icon: <SpaOutlined /> },
  { to: '/admin/follow-ups', label: 'Follow-ups', icon: <AlarmOutlined /> },
  { to: '/admin/feedback', label: 'Feedback', icon: <StarOutline /> },
  { to: '/admin/offers', label: 'Loyalty & Offers', icon: <LocalOfferOutlined /> },
  { to: '/admin/reports', label: 'Reports', icon: <InsightsOutlined />, adminOnly: true },
  { to: '/admin/settings', label: 'Settings', icon: <SettingsOutlined /> },
]

const Sidebar = ({ isAdmin, onNavigate }) => (
  <div className="flex h-full flex-col bg-white">
    <div className="border-b border-brand-100 px-5 py-4">
      <Logo size="sm" />
    </div>
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {MENU.filter((m) => isAdmin || !m.adminOnly).map((m) => (
        <NavLink
          key={m.to}
          to={m.to}
          end={m.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-brand-700 text-white shadow-sm' : 'text-muted hover:bg-brand-50 hover:text-brand-700'
            }`
          }
        >
          {m.icon}
          {m.label}
        </NavLink>
      ))}
    </nav>
    <p className="px-5 pb-4 text-[11px] text-muted">Staff & Administrator Panel</p>
  </div>
)

// Admin panel ka dhaancha: desktop pe fixed sidebar, mobile/tablet pe hamburger se khulne wala drawer
const AdminLayout = () => {
  const { staff, logoutStaff } = useAuth()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const confirm = useConfirm()
  const isAdmin = staff.role === 'admin'

  // Top search: customer ID / naam / mobile se seedha dhoondho
  const submitSearch = (e) => {
    e.preventDefault()
    const q = search.trim()
    if (!q) return
    navigate(`/admin/customers?search=${encodeURIComponent(q)}`)
    setSearch('')
  }

  const logout = async () => {
    if (await confirm({ title: 'Log out?', confirmText: 'Log out' })) {
      logoutStaff()
      navigate('/admin/login')
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 hidden border-r border-brand-100 lg:block" style={{ width: WIDTH }}>
        <Sidebar isAdmin={isAdmin} />
      </aside>
      <Drawer open={open} onClose={() => setOpen(false)} sx={{ display: { lg: 'none' } }} slotProps={{ paper: { sx: { width: WIDTH } } }}>
        <Sidebar isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
      </Drawer>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 border-b border-brand-100 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-2 px-3 sm:px-6">
            <IconButton onClick={() => setOpen(true)} sx={{ display: { lg: 'none' } }} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
            <form onSubmit={submitSearch} className="hidden max-w-md flex-1 sm:block">
              <TextField
                size="small"
                placeholder="Search customer by name, mobile or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
              />
            </form>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <NotificationBell role="staff" />
              <div className="hidden items-center gap-2 pl-2 md:flex">
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.main', fontSize: 13 }}>{initials(staff.name)}</Avatar>
                <div className="leading-tight">
                  <p className="text-sm font-medium">{staff.name}</p>
                  <Chip label={isAdmin ? 'Admin' : 'Staff'} size="small" sx={{ height: 18, fontSize: 10 }} />
                </div>
              </div>
              <Tooltip title="Log out">
                <IconButton onClick={logout} aria-label="Log out">
                  <Logout fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
