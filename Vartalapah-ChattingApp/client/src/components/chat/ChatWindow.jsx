import { Avatar, IconButton, InputBase, CircularProgress, Button } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CheckIcon from '@mui/icons-material/Check'
import BlockIcon from '@mui/icons-material/Block'
import GroupsIcon from '@mui/icons-material/Groups'
import { timeOf, lastSeenText, senderIdOf } from '../../utils/format.js'
import { fieldSx } from './muiStyles.js'

// ==========================================================
// CHAT WINDOW
// Right side ka poora hissa: header + messages + input
// Ye bhi sirf dikhata hai, logic parent (index.jsx) me hai
// ==========================================================
const ChatWindow = ({
  me,
  user,             // jiske saath chat kar rahe hain
  messages,
  loadingMessages,
  isTyping,
  text,
  onTextChange,
  onSend,
  sending,
  uploading,
  media,
  onPickMedia,
  onCancelMedia,
  editingId,
  onCancelEdit,
  onMessageMenu,
  onOpenProfile,
  onBack,
  scrollRef,
  hidden,
  imageInputRef,
  onFileSelected,
}) => {
  // Koi chat select nahi ki - welcome screen
  if (!user) {
    return (
      <main className={`${hidden ? 'hidden' : 'flex'} md:flex flex-1 flex-col bg-app-bg`}>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          {/* Khali purple dabbe ki jagah ab site ka naam - wahi font aur
              wahi gradient jo landing page ki badi heading par hai.
              Neeche ka text pehle jaisa hi hai */}
          <span
            aria-hidden="true"
            className="brand-font brand-gradient-text text-5xl sm:text-6xl leading-[1.15]"
          >
            Vārtālāpaḥ
          </span>
          <h2 className="mt-4 text-xl font-semibold">
            Welcome to <span className="brand-font">Vārtālāpaḥ</span>
          </h2>
          <p className="text-sm text-app-muted mt-1">
            Select someone from the left to start messaging
          </p>
        </div>
      </main>
    )
  }

  const isGroup = !!user.isGroup

  // canMessage false hone ki do wajah ho sakti hain (group me hamesha bhej sakte ho)
  const blockedByMe = user.isBlocked
  const accountDeleted = user.isDeleted
  const canMessage = isGroup ? true : user.canMessage

  // Input ke andar Send dikhana hai ya attach button?
  // Instagram jaisa: kuch likha ho YA photo/video chuni ho -> Send
  //                  input khali ho -> attach (photo/video) ka button
  // Edit mode me hamesha Send (yani "Save") dikhta hai
  const showSend = !!editingId || text.trim().length > 0 || !!media

  return (
    <main className={`${hidden ? 'hidden' : 'flex'} md:flex flex-1 flex-col bg-app-bg`}>
      {/* ---------- HEADER ---------- */}
      {/* Poore header par click karne se profile khulti hai - koi 3-dot menu nahi */}
      <div className="flex items-center gap-3 px-4 py-3 bg-app-panel border-b border-app-border">
        <IconButton size="small" className="md:!hidden" onClick={onBack}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <div
          className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
          onClick={onOpenProfile}
          title="View profile"
        >
          <div className="relative shrink-0">
            <Avatar src={isGroup ? user.groupImage : user.profileImage} sx={{ bgcolor: '#7c3aed' }}>
              {isGroup ? <GroupsIcon fontSize="small" /> : user.name[0]}
            </Avatar>
            {!isGroup && user.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-app-panel rounded-full" />
            )}
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{user.name}</p>

            {isGroup ? (
              <p className="text-xs text-app-muted truncate">
                {/* Group me typing par bhejne wale ka naam dikhate hain */}
                {isTyping
                  ? `${isTyping} is typing...`
                  : user.members.map((m) => (m._id === me._id ? 'You' : m.name.split(' ')[0])).join(', ')}
              </p>
            ) : (
              <p className={`text-xs truncate ${user.isOnline ? 'text-green-400' : 'text-app-muted'}`}>
                {accountDeleted
                  ? 'Account deleted'
                  : blockedByMe
                  ? 'Blocked'
                  : isTyping
                  ? 'typing...'
                  : user.isOnline
                  ? 'Online'
                  : lastSeenText(user.lastSeen)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ---------- MESSAGES ----------
          Do div ka jugaad (WhatsApp/Instagram jaisa):
          BAHAR wala -> flex-1 + overflow-y-auto = yahi scroll hota hai
          ANDAR wala -> min-h-full + justify-end = messages neeche se chipakte hain

          Kam messages  -> andar wali div poori height leti hai aur justify-end
                           messages ko NEECHE dhakel deta hai
          Zyada messages -> andar wali div badi ho jati hai aur normal scroll aata hai */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll">
        <div className="min-h-full flex flex-col justify-end p-4 space-y-2">
          {loadingMessages && (
            <div className="flex justify-center py-8">
              <CircularProgress size={26} />
            </div>
          )}

          {!loadingMessages && messages.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-app-muted">
                {isGroup ? `No messages in ${user.name} yet` : `No messages with ${user.name} yet`}
              </p>
              <p className="text-xs text-app-muted mt-1">Send the first message!</p>
            </div>
          )}

          {messages.map((msg, index) => {
            // Message mera hai ya saamne wale ka
            const isMine = senderIdOf(msg) === me._id

            // Instagram ki tarah "Seen" sirf mere SABSE AAKHRI message ke neeche
            // dikhta hai, har message ke neeche nahi
            const isMyLastMessage =
              isMine &&
              !messages.slice(index + 1).some((m) => senderIdOf(m) === me._id)

            // Saamne wale ki avatar bhi Instagram jaisi - sirf uske consecutive
            // messages ke SABSE AAKHRI wale ke neeche dikhti hai, baaki par
            // jagah khali chhod dete hain (neeche visibility:hidden se) taaki
            // bubbles left me shift na hon
            const nextMsg = messages[index + 1]
            const isOtherLastInRun =
              !isMine && (!nextMsg || senderIdOf(nextMsg) !== senderIdOf(msg) || nextMsg.messageType === 'system')

            // ---- SYSTEM MESSAGE ----
            // App khud banati hai (block / unblock). Bubble ki jagah
            // beech me chhota grey text dikhta hai, WhatsApp ki tarah
            if (msg.messageType === 'system') {
              const verb = msg.text === 'blocked' ? 'blocked' : 'unblocked'

              // Database me sirf verb save hai, poora text yahan banate hain
              const line = isMine
                ? `You ${verb} ${user.name}`
                : `${user.name} ${verb} you`

              return (
                <div key={msg._id} className="flex justify-center py-1">
                  <span className="text-[11px] text-app-muted bg-app-panel rounded-full px-3 py-1">
                    {line} · {timeOf(msg.createdAt)}
                  </span>
                </div>
              )
            }

            return (
              <div key={msg._id}>
              <div
                className={`group flex items-end gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                {isMine && (
                  <IconButton
                    size="small"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={(e) => onMessageMenu(e, msg)}
                    title="Message options"
                  >
                    <MoreVertIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}

                {/* Saamne wale ki chhoti avatar - group me har sender ki apni,
                    private chat me seedha `user` (jiske saath baat ho rahi hai) */}
                {!isMine && (
                  <Avatar
                    src={isGroup ? msg.sender?.profileImage : user.profileImage}
                    sx={{
                      width: 26,
                      height: 26,
                      bgcolor: '#7c3aed',
                      fontSize: 12,
                      visibility: isOtherLastInRun ? 'visible' : 'hidden',
                    }}
                  >
                    {(isGroup ? msg.sender?.name : user.name)?.[0]}
                  </Avatar>
                )}

                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    isMine
                      ? 'brand-gradient text-white rounded-br-sm'
                      : 'bg-app-bubble text-app-text rounded-bl-sm'
                  } ${editingId === msg._id ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  {/* Group me har message ke upar bhejne wale ka naam
                      Private chat me iski zarurat nahi - sirf do log hain */}
                  {isGroup && !isMine && (
                    <p className="text-[11px] font-semibold text-brand-light mb-0.5">
                      {msg.sender?.name || 'Unknown'}
                    </p>
                  )}

                  {/* plain-text = normal system font
                      Chat me custom display font padhne me mushkil hota hai,
                      isliye messages hamesha normal font me rakhte hain */}
                  {msg.messageType === 'text' && (
                    <p className="plain-text whitespace-pre-wrap break-words">{msg.text}</p>
                  )}

                  {msg.messageType === 'image' && (
                    <img src={msg.mediaUrl} alt="sent" className="rounded-lg max-w-full max-h-60" />
                  )}

                  {msg.messageType === 'video' && (
                    <video src={msg.mediaUrl} controls className="rounded-lg max-w-full max-h-60" />
                  )}

                  <div
                    className={`plain-text flex items-center justify-end gap-1 mt-1 ${
                      isMine ? 'text-white/70' : 'text-app-muted'
                    }`}
                  >
                    {msg.isEdited && <span className="text-[10px] italic">edited</span>}
                    <span className="text-[10px]">{timeOf(msg.createdAt)}</span>
                  </div>
                </div>

                {!isMine && (
                  <IconButton
                    size="small"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={(e) => onMessageMenu(e, msg)}
                    title="Message options"
                  >
                    <MoreVertIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </div>

              {/* ---- MESSAGE STATUS (Instagram jaisa) ----
                  Chhote tick icons ki jagah saaf text - ek nazar me pata chal jata hai:

                    Sent      = message database me pahunch gaya, banda offline hai
                    Delivered = banda online hai lekin chat kholi nahi
                    Seen      = banda ne chat kholkar padh liya  <- yahi asli confirmation hai

                  Sirf mere SABSE AAKHRI message ke neeche dikhta hai (Instagram jaisa),
                  aur group me nahi - wahan kai log hote hain */}
              {isMyLastMessage && !isGroup && (
                <p
                  className={`plain-text text-[10px] text-right mt-0.5 mr-1 ${
                    msg.isRead ? 'text-brand-light font-medium' : 'text-app-muted'
                  }`}
                >
                  {msg.isRead ? 'Seen' : user.isOnline ? 'Delivered' : 'Sent'}
                </p>
              )}
              </div>
            )
          })}

          {/* Typing indicator - teen bouncing dots */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-app-bubble rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                <span className="w-2 h-2 bg-app-muted rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-app-muted rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-app-muted rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit mode ka banner */}
      {editingId && (
        <div className="flex items-center justify-between px-4 py-2 bg-yellow-500/10 border-t border-yellow-500/30 text-xs">
          <span className="text-yellow-400">Editing message</span>
          <Button size="small" onClick={onCancelEdit}>Cancel</Button>
        </div>
      )}

      {/* Media preview - bhejne se pehle dikhta hai */}
      {media && (
        <div className="px-4 pt-3 bg-app-panel border-t border-app-border">
          <div className="relative inline-block">
            {media.type === 'image' ? (
              <img src={media.url} alt="preview" className="h-24 rounded-lg" />
            ) : (
              <video src={media.url} className="h-24 rounded-lg" />
            )}

            {/* Upload chalu ho to preview ke upar loader */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center gap-1">
                <CircularProgress size={22} />
                <span className="text-[10px]">Uploading...</span>
              </div>
            )}

            {/* Upload ke beech me cancel nahi kar sakte */}
            {!uploading && (
              <IconButton
                size="small"
                onClick={onCancelMedia}
                sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#334155' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </div>

          <p className="text-[11px] text-app-muted mt-1">
            {(media.file.size / (1024 * 1024)).toFixed(1)} MB Â· {media.type}
          </p>
        </div>
      )}

      {/* ---------- INPUT ---------- */}
      {!canMessage ? (
        // Block ya deleted account - input ki jagah message dikhate hain
        <div className="px-4 py-4 bg-app-panel border-t border-app-border text-center">
          <BlockIcon className="text-app-muted" fontSize="small" />
          <p className="text-sm text-app-muted mt-1">
            {accountDeleted
              ? 'This account has been deleted'
              : blockedByMe
              ? `You blocked ${user.name}. Unblock from their profile to message again.`
              : "You can't message this user"}
          </p>
        </div>
      ) : (
        <div className="px-3 py-3 bg-app-panel border-t border-app-border">
          {/* Ek hi hidden file input - image aur video DONO ke liye
              accept me dono ke types de diye hain, isliye file picker
              me dono dikhengi. Type ka pata baad me file.type se chal jata hai */}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            ref={imageInputRef}
            onChange={onFileSelected}
            className="hidden"
          />

          {/* Saare buttons input ke ANDAR hain (Instagram jaisa)
              Isliye ek rounded box banaya aur InputBase ko uske andar daala */}
          <div className="flex items-center gap-1 bg-app-bg rounded-full pl-4 pr-1.5 py-1">
            <InputBase
              value={text}
              onChange={onTextChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSend()
                if (e.key === 'Escape') onCancelEdit()
              }}
              placeholder={editingId ? 'Edit message...' : 'Message...'}
              // plain-text = normal font, taki jo type kar rahe ho wo bilkul
              // waisa hi dikhe jaisa bubble me dikhega
              className="plain-text flex-1 text-sm"
              sx={fieldSx}
            />

            {/* showSend true hai to Send button, warna image/video icons
                Dono ek hi jagah aate hain - isliye ek badalta hai to dusra hat jata hai */}
            {showSend ? (
              <IconButton
                size="small"
                title={editingId ? 'Save' : 'Send'}
                onClick={onSend}
                disabled={sending}
                sx={{
                  background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: 'white',
                  '&:hover': { background: 'linear-gradient(135deg,#6d28d9,#9333ea)' },
                  '&.Mui-disabled': { color: 'white', opacity: 0.6 },
                }}
              >
                {sending ? (
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                ) : editingId ? (
                  <CheckIcon sx={{ fontSize: 18 }} />
                ) : (
                  <SendIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            ) : (
              // Ek hi button - photo aur video dono iske through jaate hain
              <IconButton
                size="small"
                title="Send photo or video (image max 5 MB, video max 20 MB and 10 seconds)"
                onClick={onPickMedia}
              >
                <AttachFileIcon sx={{ fontSize: 20 }} />
              </IconButton>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default ChatWindow
