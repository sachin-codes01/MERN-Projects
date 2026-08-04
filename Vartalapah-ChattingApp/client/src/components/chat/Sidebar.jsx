import { memo } from 'react'
import { CircularProgress, Divider, IconButton, InputBase, Tooltip } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import PushPinIcon from '@mui/icons-material/PushPin'
import BlockIcon from '@mui/icons-material/Block'
import ArchiveIcon from '@mui/icons-material/Archive'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { timeOf, previewOf } from '@/utils/format.js'
import { fieldSx, dividerSx } from '@/styles/muiStyles.js'
import { useLongPress } from '@/hooks/ui/useLongPress.js'
import ChatAvatar from '@/components/ui/ChatAvatar.jsx'
import UserIdentity from '@/components/ui/UserIdentity.jsx'
import BottomNav from './BottomNav.jsx'
import ProfilePanel from './ProfilePanel.jsx'

// Chaar jagah. "profile" sirf mobile par tab hai - desktop par wo
// neeche wali row se dialog me khulta hai
const TABS = [
  { key: 'chats', label: 'Chats' },
  { key: 'requests', label: 'Requests' },
  { key: 'all', label: 'All people' },
]

const TAB_TITLES = {
  chats: 'Chats',
  requests: 'Requests',
  all: 'All people',
  profile: 'Profile',
}

// ==========================================================
// CHAT ROW
//
// Alag component isliye hai ki har row ko apna useLongPress chahiye
// (hook ko loop wale function ke andar nahi bula sakte), aur memo se
// ek row badalne par baaki 50 rows dobara render nahi hote
// ==========================================================
// subtitle: naam ke neeche kya likhna hai. Har tab ki zarurat alag hai:
//
//   'preview' (Chats)       -> aakhri message. Jinse roz baat hoti hai
//                              unhe email se pehchanne ki zarurat nahi
//   'both'    (Requests)    -> email AUR aakhri message. Anjaan banda
//                              hai, isliye "kaun hai" (email) aur "kya
//                              bheja" (message) - dono chahiye, tabhi
//                              tay kar paoge ki reply karna hai ya nahi
//   'email'   (All people)  -> sirf email. Yahan sirf banda dhoondhna
//                              hai, uski purani chat se matlab nahi
const ChatRow = memo(({ row, isSelected, onOpen, onMenu, subtitle = 'preview' }) => {
  // Mobile par ungli dabaye rakho, desktop par right click - dono se
  // wahi menu. Scroll karte waqt galti se nahi khulta (10px tolerance)
  const pressHandlers = useLongPress({
    onLongPress: (point) => onMenu(row, point),
    onClick: () => onOpen(row),
  })

  // Group ka koi email hota hi nahi, aur deleted account ki email
  // dikhana bekaar hai (wo scramble ho chuki hoti hai) - dono is line
  // se bahar rehte hain
  const emailLine = subtitle !== 'preview' && !row.isGroup && !row.isDeleted && row.email
    ? row.email
    : null

  // 'email' wale tab me preview nahi chahiye - lekin email mil hi na
  // paye (group ya deleted account) to row khali reh jayegi, isliye
  // wahan preview wapas dikha dete hain
  const showPreview = subtitle !== 'email' || !emailLine

  return (
    <div
      {...pressHandlers}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(row)
        }
      }}
      aria-label={`${row.name}${row.unreadCount > 0 ? `, ${row.unreadCount} unread` : ''}`}
      className={`no-callout group flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-app-hover ${
        isSelected ? 'bg-app-hover border-l-2 border-brand' : ''
      }`}
      // 44px+ touch target - poori row hi tap ka area hai
      style={{ minHeight: 64 }}
    >
      {/* Group ka icon vs aadmi ki photo, aur online dot - teeno niyam
          ChatAvatar ke andar hain */}
      <ChatAvatar user={row} size={40} showPresence />

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-2">
          <p className="font-semibold text-sm truncate flex items-center gap-1">
            {row.isPinned && <PushPinIcon sx={{ fontSize: 13 }} className="text-brand" />}
            {row.isBlocked && <BlockIcon sx={{ fontSize: 13 }} className="text-red-400" />}
            {row.name}
          </p>

          <div className="flex items-center gap-1 shrink-0">
            {row.lastMessage && (
              <span className="plain-text text-xs text-app-muted">
                {timeOf(row.lastMessage.createdAt)}
              </span>
            )}

            {/* 3-dot button SIRF desktop par - mobile par long press hai
                (har row me button rakhne se list bhadd dikhti hai) */}
            <IconButton
              size="small"
              className="!hidden md:!inline-flex opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
              aria-label={`Options for ${row.name}`}
              onClick={(e) => {
                // Row ka onClick chal jayega warna chat khul jayegi
                e.stopPropagation()
                const box = e.currentTarget.getBoundingClientRect()
                onMenu(row, { x: box.left, y: box.bottom })
              }}
            >
              <MoreVertIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2">
          {/* Do lines ek column me, unread badge unke bagal me - isse
              badge dono soorat me apni jagah rehta hai, chahe neeche ek
              line ho ya do */}
          <div className="min-w-0">
            {emailLine && (
              <p className="plain-text text-[11px] text-app-muted truncate">{emailLine}</p>
            )}

            {showPreview && (
              <p
                className={`plain-text text-xs truncate ${
                  row.unreadCount > 0 ? 'text-app-text font-medium' : 'text-app-muted'
                }`}
              >
                {row.isDeleted
                  ? 'Account deleted'
                  : row.isGroup && !row.lastMessage
                  ? `${row.members.length} members`
                  : // Koi conversation abhi shuru hi nahi hui - "Tap to start
                    // chatting" jaisa khaali placeholder dikhane se behtar hai
                    // email dikha do, kaam ki jaankari hai
                    !row.isGroup && !row.lastMessage && row.email
                  ? row.email
                  : previewOf(row.lastMessage)}
              </p>
            )}
          </div>

          {row.unreadCount > 0 && (
            <span className="text-[10px] text-white bg-brand rounded-full px-2 py-0.5 shrink-0">
              {row.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})

ChatRow.displayName = 'ChatRow'

// ==========================================================
// SIDEBAR
//
// Mobile par ye poori screen leta hai (jab tak koi chat na khuli ho)
// aur neeche bottom navigation dikhata hai. Desktop par ye baayein
// taraf ka fixed column hai aur tabs upar pill ki tarah dikhte hain
//
// Layout wahi teen-hisse wala hai jo ChatWindow me hai:
//   header (shrink-0) + list (flex-1 min-h-0 scroll) + nav (shrink-0)
// Isse list kitni bhi lambi ho, bottom nav kabhi screen se bahar nahi jata
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
  onRowMenu,
  onOpenMyProfile,
  onNewGroup,
  hidden,
  profile,
  onLogout,
}) => {
  const isProfileTab = tab === 'profile'

  return (
    <aside
      className={`${
        hidden ? 'hidden' : 'flex'
      } md:flex w-full md:w-80 lg:w-96 shrink-0 bg-app-panel md:border-r border-app-border flex-col min-h-0`}
    >
      {/* ================= HEADER =================
          pt-safe -> notch / status bar / Chrome ke URL bar ke neeche se
          shuru hota hai. Iske bina logo aadha kata hua dikhta tha */}
      <div className="shrink-0 pt-safe px-safe">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="min-w-0">
            <h1
              className="text-[1.7rem] leading-tight brand-font brand-gradient-text truncate"
              style={{ filter: 'drop-shadow(0 2px 10px rgba(139,92,246,0.35))' }}
            >
              Vārtālāpaḥ
            </h1>
          </div>

          {!isProfileTab && (
            <Tooltip title="New group">
              <IconButton onClick={onNewGroup} className="tap-target" aria-label="Create new group">
                <GroupAddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </div>

        {/* ---------- TABS (sirf desktop) ----------
            Chats    = jinse maine baat ki hai
            Requests = jinhone mujhe message kiya lekin maine reply nahi kiya
            All      = saare registered users
            Mobile par yahi teen bottom nav me hain */}
        <div className="hidden md:flex gap-1 px-3 pb-2">
          {TABS.map((t) => {
            const count = tabCounts?.[t.key] || 0

            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-current={tab === t.key ? 'page' : undefined}
                className={`relative flex-1 text-xs font-semibold py-2 rounded-full transition-colors ${
                  tab === t.key
                    ? 'brand-gradient text-white'
                    : 'bg-app-bg text-app-muted hover:text-app-text'
                }`}
              >
                {t.label}

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
        {/* Har tab ka apna alag search hai. Profile tab par iska matlab nahi */}
        {!isProfileTab && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 bg-app-bg rounded-full px-3.5 py-2.5 border border-transparent transition-colors duration-200 focus-within:border-brand/50 no-zoom-input">
              <SearchIcon fontSize="small" className="text-app-muted" />
              <InputBase
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search in ${TAB_TITLES[tab]}...`}
                className="plain-text w-full text-sm font-medium"
                sx={fieldSx}
                inputProps={{ 'aria-label': `Search in ${TAB_TITLES[tab]}`, enterKeyHint: 'search' }}
              />
              {search && (
                <IconButton size="small" onClick={() => setSearch('')} aria-label="Clear search">
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </div>
          </div>
        )}

        <Divider sx={dividerSx} />
      </div>

      {/* ================= SCROLL AREA =================
          flex-1 min-h-0 -> lambi list bottom nav ko dhakel nahi sakti */}
      <div className="flex-1 min-h-0 overflow-y-auto thin-scroll chat-scroll px-safe">
        {/* ---------- PROFILE TAB (sirf mobile) ---------- */}
        {isProfileTab ? (
          <div className="px-5 py-5">
            <ProfilePanel
              me={me}
              draft={profile.draft}
              setDraft={profile.setDraft}
              avatarInputRef={profile.avatarInputRef}
              onAvatarSelect={profile.onAvatarSelect}
              onSave={profile.onSave}
              saving={profile.saving}
              onLogout={onLogout}
              onDeleteAccount={profile.onDeleteAccount}
              showSaveButton
            />
          </div>
        ) : (
          <>
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

            {visibleUsers.map((row) => (
              <ChatRow
                key={row._id}
                row={row}
                isSelected={selectedUser?._id === row._id}
                onOpen={onOpenChat}
                onMenu={onRowMenu}
                subtitle={tab === 'all' ? 'email' : tab === 'requests' ? 'both' : 'preview'}
              />
            ))}

            {/* ---------- ARCHIVED SECTION ---------- */}
            {archivedUsers.length > 0 && (
              <>
                <Divider sx={dividerSx} />
                <button
                  type="button"
                  onClick={() => setShowArchived(!showArchived)}
                  aria-expanded={showArchived}
                  className="w-full flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-app-hover text-app-muted no-tap-flash"
                  style={{ minHeight: 48 }}
                >
                  {showArchived ? (
                    <KeyboardArrowDownIcon fontSize="small" />
                  ) : (
                    <KeyboardArrowRightIcon fontSize="small" />
                  )}
                  <ArchiveIcon sx={{ fontSize: 18 }} />
                  <span className="text-sm">Archived ({archivedUsers.length})</span>
                </button>

                {showArchived &&
                  archivedUsers.map((row) => (
                    <ChatRow
                      key={row._id}
                      row={row}
                      isSelected={selectedUser?._id === row._id}
                      onOpen={onOpenChat}
                      onMenu={onRowMenu}
                      subtitle={tab === 'all' ? 'email' : tab === 'requests' ? 'both' : 'preview'}
                    />
                  ))}
              </>
            )}
          </>
        )}
      </div>

      {/* ---------- MERI PROFILE (sirf desktop) ----------
          Mobile par ye bottom nav ka Profile tab hai */}
      <Divider sx={dividerSx} className="!hidden md:!block" />
      <button
        type="button"
        onClick={onOpenMyProfile}
        className="!hidden md:!flex shrink-0 items-center gap-3 px-4 py-3 cursor-pointer hover:bg-app-hover text-left"
        aria-label="Open my profile"
      >
        {/* Khud ke liye online dot dikhane ka matlab nahi - wo sirf
            DUSRE logon ke liye hai (chat rows me already hai) */}
        <ChatAvatar user={me} size={40} />

        <UserIdentity name={me.name} email={me.email} />
      </button>

      {/* ---------- BOTTOM NAV (sirf mobile) ----------
          Gesture bar / home indicator ke upar rukta hai - dekho BottomNav.jsx */}
      <BottomNav tab={tab} onChange={setTab} counts={tabCounts} me={me} />
    </aside>
  )
}

export default Sidebar
