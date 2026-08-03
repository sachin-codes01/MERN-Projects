import { Avatar, IconButton, InputBase, Divider, CircularProgress, Tooltip } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import PushPinIcon from '@mui/icons-material/PushPin'
import BlockIcon from '@mui/icons-material/Block'
import ArchiveIcon from '@mui/icons-material/Archive'
import GroupsIcon from '@mui/icons-material/Groups'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { timeOf, previewOf } from '../../utils/format.js'
import { fieldSx, dividerSx } from './muiStyles.js'

// Sidebar ke teen tabs
const TABS = [
  { key: 'chats', label: 'Chats' },
  { key: 'requests', label: 'Requests' },
  { key: 'all', label: 'All people' },
]

// ==========================================================
// SIDEBAR
// Ye component sirf DIKHATA hai - koi API call nahi karta
// Saara data aur functions parent (index.jsx) se props me aate hain
// Isse ise samajhna aur test karna aasan ho jata hai
// ==========================================================
const Sidebar = ({
  me,
  visibleUsers,
  archivedUsers,
  showArchived,
  setShowArchived,
  loading,
  tab,
  setTab,
  tabCounts,
  search,
  setSearch,
  selectedUser,
  onOpenChat,
  onLongPress,
  onOpenMyProfile,
  onNewGroup,
  hidden,
}) => {
  // Ek chat row banane wala chhota helper
  // Normal list aur archived list dono me yahi use hota hai
  const renderRow = (u) => (
    <div
      key={u._id}
      onClick={() => onOpenChat(u)}
      // Right click par bhi wahi menu khulta hai jo long press par khulta hai
      onContextMenu={(e) => {
        e.preventDefault()
        onLongPress(e, u)
      }}
      // Mobile par ungli 500ms dabaye rakho to menu khulta hai
      onTouchStart={(e) => onLongPress(e, u, true)}
      onTouchEnd={() => onLongPress(null)}
      onTouchMove={() => onLongPress(null)}
      className={`group flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-app-hover ${
        selectedUser?._id === u._id ? 'bg-app-hover border-l-2 border-brand' : ''
      }`}
    >
      <div className="relative">
        {/* Group ka apna icon hota hai, user ki profile photo */}
        <Avatar src={u.isGroup ? u.groupImage : u.profileImage} sx={{ bgcolor: '#7c3aed' }}>
          {u.isGroup ? <GroupsIcon fontSize="small" /> : u.name[0]}
        </Avatar>

        {/* Green dot - Socket.IO se live aata hai (group par nahi lagta) */}
        {!u.isGroup && u.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-app-panel rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-2">
          <p className="font-semibold text-sm truncate flex items-center gap-1">
            {u.isPinned && <PushPinIcon sx={{ fontSize: 13 }} className="text-brand" />}
            {u.isBlocked && <BlockIcon sx={{ fontSize: 13 }} className="text-red-400" />}
            {u.name}
          </p>

          <div className="flex items-center gap-1 shrink-0">
            {u.lastMessage && (
              <span className="plain-text text-xs text-app-muted">
                {timeOf(u.lastMessage.createdAt)}
              </span>
            )}

            {/* 3-dot button SIRF desktop par (md se badi screen)
                Mobile par ye chhupa rehta hai - wahan long press se menu khulta hai
                (mobile par har row me button rakhne se list bhadd dikhti hai) */}
            <IconButton
              size="small"
              className="!hidden md:!inline-flex opacity-0 group-hover:opacity-100"
              title="Options"
              onClick={(e) => {
                // Row ka onClick chal jayega warna chat khul jayegi
                e.stopPropagation()
                onLongPress(e, u)
              }}
            >
              <MoreVertIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2">
          <p className={`plain-text text-xs truncate ${u.unreadCount > 0 ? 'text-app-text font-medium' : 'text-app-muted'}`}>
            {u.isDeleted
              ? 'Account deleted'
              : u.isGroup && !u.lastMessage
              ? `${u.members.length} members`
              : previewOf(u.lastMessage)}
          </p>

          {/* Unread count badge */}
          {u.unreadCount > 0 && (
            <span className="text-[10px] text-white bg-brand rounded-full px-2 py-0.5 shrink-0">
              {u.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <aside
      className={`${hidden ? 'hidden' : 'flex'} md:flex w-full md:w-80 lg:w-96 bg-app-panel border-r border-app-border flex-col`}
    >
      {/* Logo + naya group banane ka button */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h1 className="text-2xl brand-font brand-gradient-text">Vārtālāpaḥ</h1>

        <Tooltip title="New group">
          <IconButton size="small" onClick={onNewGroup}>
            <GroupAddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      {/* ---------- TABS ---------- */}
      {/* Chats    = jinse maine baat ki hai (maine kam se kam ek message bheja) */}
      {/* Requests = jinhone mujhe message kiya lekin maine reply nahi kiya */}
      {/* All      = saare registered users */}
      <div className="flex gap-1 px-3 pb-2">
        {TABS.map((t) => {
          const count = tabCounts?.[t.key] || 0

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex-1 text-xs font-semibold py-1.5 rounded-full transition-colors ${
                tab === t.key
                  ? 'brand-gradient text-white'
                  : 'bg-app-bg text-app-muted hover:text-app-text'
              }`}
            >
              {t.label}

              {/* Chhota number wala dot - 99 se zyada ho to "99+" */}
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full border border-app-panel">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ---------- SEARCH ---------- */}
      {/* Har tab ka apna alag search hai - jo tab khuli hai usi ke andar dhundta hai */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-app-bg rounded-full px-3 py-2">
          <SearchIcon fontSize="small" className="text-app-muted" />
          <InputBase
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search in ${TABS.find((t) => t.key === tab).label}...`}
            className="plain-text w-full text-sm"
            sx={fieldSx}
          />
          {search && (
            <IconButton size="small" onClick={() => setSearch('')}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </div>
      </div>

      <Divider sx={dividerSx} />

      {/* ---------- LIST ---------- */}
      <div className="flex-1 overflow-y-auto thin-scroll">
        {loading && (
          <div className="flex justify-center mt-8">
            <CircularProgress size={26} />
          </div>
        )}

        {!loading && visibleUsers.length === 0 && (
          <div className="text-center mt-8 px-6">
            <p className="text-sm text-app-muted">
              {search
                ? 'No results found'
                : tab === 'chats'
                ? 'No conversations yet'
                : tab === 'requests'
                ? 'No message requests'
                : 'No other users have signed up yet'}
            </p>
            {!search && tab === 'chats' && (
              <p className="text-xs text-app-muted mt-2">
                Open "All people" and send someone a message
              </p>
            )}
          </div>
        )}

        {visibleUsers.map(renderRow)}

        {/* ---------- ARCHIVED SECTION ---------- */}
        {archivedUsers.length > 0 && (
          <>
            <Divider sx={dividerSx} />
            <div
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-app-hover text-app-muted"
            >
              {showArchived ? (
                <KeyboardArrowDownIcon fontSize="small" />
              ) : (
                <KeyboardArrowRightIcon fontSize="small" />
              )}
              <ArchiveIcon sx={{ fontSize: 18 }} />
              <span className="text-sm">Archived ({archivedUsers.length})</span>
            </div>

            {showArchived && archivedUsers.map(renderRow)}
          </>
        )}
      </div>

      {/* ---------- MERI PROFILE ---------- */}
      {/* Click karne par My Profile dialog khulta hai (logout aur delete account wahin hai) */}
      <Divider sx={dividerSx} />
      <div
        onClick={onOpenMyProfile}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-app-hover"
        title="Open my profile"
      >
        {/* Khud ke liye online dot dikhane ka koi matlab nahi - wo sirf
            DUSRE logon ke liye hai (chat rows me already hai) */}
        <Avatar src={me.profileImage} sx={{ bgcolor: '#a855f7' }}>{me.name[0]}</Avatar>

        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{me.name}</p>
          <p className="plain-text text-xs text-app-muted truncate">{me.email}</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
