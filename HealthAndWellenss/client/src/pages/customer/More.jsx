import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import HistoryOutlined from '@mui/icons-material/HistoryOutlined'
import AlarmOutlined from '@mui/icons-material/AlarmOutlined'
import WorkspacePremiumOutlined from '@mui/icons-material/WorkspacePremiumOutlined'
import PersonOutline from '@mui/icons-material/PersonOutlined'
import HelpOutline from '@mui/icons-material/HelpOutlineOutlined'
import Logout from '@mui/icons-material/Logout'
import ChevronRight from '@mui/icons-material/ChevronRight'
import ContactDialog from '../../components/common/ContactDialog.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useConfirm, useToast } from '../../context/FeedbackContext.jsx'

const LINKS = [
  { to: '/profile', label: 'My Profile', icon: <PersonOutline /> },
  { to: '/history', label: 'Visit History', icon: <HistoryOutlined /> },
  { to: '/reminders', label: 'Follow-up & Reminders', icon: <AlarmOutlined /> },
  { to: '/loyalty', label: 'Loyalty & Offers', icon: <WorkspacePremiumOutlined /> },
]

// Mobile ke "More" tab ka menu
const More = () => {
  const { logoutCustomer } = useAuth()
  const [contactOpen, setContactOpen] = useState(false)
  const navigate = useNavigate()
  const confirm = useConfirm()
  const toast = useToast()

  const logout = async () => {
    if (await confirm({ title: 'Log out?', confirmText: 'Log out' })) {
      logoutCustomer()
      toast.info('You have been logged out')
      navigate('/')
    }
  }

  const rowClass = 'flex w-full items-center gap-4 border-b border-brand-50 px-4 py-4 text-left last:border-0 hover:bg-brand-50'

  return (
    <div className="mx-auto max-w-md">
      <h1 className="heading mb-5 text-3xl">More</h1>
      <div className="overflow-hidden border-t border-brand-200">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className={rowClass}>
            <span className="text-brand-500">{l.icon}</span>
            <span className="flex-1 font-medium">{l.label}</span>
            <ChevronRight className="text-muted" />
          </Link>
        ))}
        <button onClick={() => setContactOpen(true)} className={rowClass}>
          <span className="text-brand-500"><HelpOutline /></span>
          <span className="flex-1 font-medium">Help & Support</span>
          <ChevronRight className="text-muted" />
        </button>
        <button onClick={logout} className={`${rowClass} text-red-600`}>
          <Logout />
          <span className="flex-1 font-medium">Logout</span>
        </button>
      </div>
      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}

export default More
