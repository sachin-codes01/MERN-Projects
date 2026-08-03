import { Avatar, Badge } from '@mui/material'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import MarkUnreadChatAltIcon from '@mui/icons-material/MarkUnreadChatAlt'
import MarkChatUnreadOutlinedIcon from '@mui/icons-material/MarkChatUnreadOutlined'
import PeopleIcon from '@mui/icons-material/People'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'

// ==========================================================
// BOTTOM NAVIGATION (sirf mobile)
//
// Chaar jagah: Chats, Requests, All people, Profile
//
// Sabse zaroori baat neeche wali padding hai:
//   pb = var(--safe-bottom)
// Iske bina Android ke gesture bar aur iPhone ke home indicator ke
// PEECHE nav chhup jata hai - button dikhte to hain lekin dabte nahi.
// --safe-bottom index.css me env(safe-area-inset-bottom) se banti hai,
// aur wo tabhi kaam karti hai jab index.html me viewport-fit=cover ho
//
// Keyboard khulne par --safe-bottom 0 ho jati hai (wahan ab keyboard
// hai, gesture bar nahi) - dekho index.css
// ==========================================================

const NAV_ITEMS = [
  {
    key: 'chats',
    label: 'Chats',
    Icon: ChatBubbleOutlineIcon,
    ActiveIcon: ChatBubbleIcon,
  },
  {
    key: 'requests',
    label: 'Requests',
    Icon: MarkChatUnreadOutlinedIcon,
    ActiveIcon: MarkUnreadChatAltIcon,
  },
  {
    key: 'all',
    label: 'People',
    Icon: PeopleOutlineIcon,
    ActiveIcon: PeopleIcon,
  },
]

const BottomNav = ({ tab, onChange, counts, me }) => (
  <nav
    aria-label="Main navigation"
    className="md:hidden shrink-0 bg-app-panel border-t border-app-border px-safe"
    style={{ paddingBottom: 'var(--safe-bottom)' }}
  >
    <div className="flex items-stretch">
      {NAV_ITEMS.map(({ key, label, Icon, ActiveIcon }) => {
        const active = tab === key
        const count = counts?.[key] || 0
        const ShownIcon = active ? ActiveIcon : Icon

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            // aria-current screen reader ko batata hai ki abhi kaunsa khula hai
            aria-current={active ? 'page' : undefined}
            aria-label={count > 0 ? `${label}, ${count} new` : label}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 no-tap-flash transition-colors ${
              active ? 'text-brand-light' : 'text-app-muted'
            }`}
            // 44px minimum - guideline ke hisaab se
            style={{ minHeight: 52 }}
          >
            <Badge
              badgeContent={count > 99 ? '99+' : count}
              color="error"
              overlap="circular"
              sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 16, minWidth: 16 } }}
            >
              <ShownIcon sx={{ fontSize: 22 }} />
            </Badge>

            <span className="text-[10px] font-medium leading-none">{label}</span>
          </button>
        )
      })}

      {/* Profile - baaki icons ki jagah apni photo, Instagram jaisa */}
      <button
        type="button"
        onClick={() => onChange('profile')}
        aria-current={tab === 'profile' ? 'page' : undefined}
        aria-label="Profile"
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 no-tap-flash transition-colors ${
          tab === 'profile' ? 'text-brand-light' : 'text-app-muted'
        }`}
        style={{ minHeight: 52 }}
      >
        <Avatar
          src={me.profileImage}
          sx={{
            width: 22, height: 22, fontSize: 11, bgcolor: '#a855f7',
            // Active tab par photo ke chaaron taraf halka sa ring
            outline: tab === 'profile' ? '2px solid currentColor' : 'none',
            outlineOffset: 1,
          }}
        >
          {me.name[0]}
        </Avatar>

        <span className="text-[10px] font-medium leading-none">Profile</span>
      </button>
    </div>
  </nav>
)

export default BottomNav
