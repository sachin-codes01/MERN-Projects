import { Avatar } from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import { BRAND } from '@/constants/theme.js'

// ==========================================================
// CHAT AVATAR
//
// Ek hi avatar ke teen niyam poori app me barabar rehne chahiye:
//   1. Group ho to groupImage, warna profileImage
//   2. Photo na ho to fallback - group me icon, aadmi ka pehla akshar
//   3. Online wala hara dot sirf aadmi par, group par kabhi nahi
//
// Ye teeno niyam pehle AATH jagah alag alag likhe the (Sidebar,
// ChatWindow ka header, MessageBubble, ForwardDialog, GroupDialogs...).
// Ek jagah #7c3aed reh gaya tha aur ek jagah dot group par bhi lag
// raha tha - kyunki har jagah haath se copy kiya gaya tha.
//
// Ab ek hi component hai. Avatar ka niyam badalna ho to sirf yahan
// ==========================================================
const ChatAvatar = ({ user, size = 40, showPresence = false, className = '' }) => {
  const isGroup = !!user.isGroup

  // Presence sirf aadmi ka hota hai - group kabhi "online" nahi hota
  const showDot = showPresence && !isGroup && user.isOnline

  // Dot avatar ke naap ke hisaab se - chhoti avatar par bada dot bhadda lagta hai
  const dotSize = Math.max(8, Math.round(size * 0.3))

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <Avatar
        src={isGroup ? user.groupImage : user.profileImage}
        // alt khali rakha hai jaan boojhkar: avatar ke bagal me naam
        // hamesha likha hota hai, isliye screen reader ke liye ye
        // sirf dohraav hai
        alt=""
        sx={{
          width: size,
          height: size,
          bgcolor: BRAND.dark,
          fontSize: size * 0.42,
        }}
      >
        {isGroup ? <GroupsIcon sx={{ fontSize: size * 0.5 }} /> : user.name?.[0]}
      </Avatar>

      {showDot && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 right-0 bg-green-500 border-2 border-app-panel rounded-full"
          style={{ width: dotSize, height: dotSize }}
        />
      )}
    </div>
  )
}

export default ChatAvatar
