import { Button, CircularProgress, IconButton, InputBase } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import CheckIcon from '@mui/icons-material/Check'
import BlockIcon from '@mui/icons-material/Block'
import ReplyIcon from '@mui/icons-material/Reply'
import { timeOf, lastSeenText, senderIdOf, previewOf, systemLineOf } from '@/utils/format.js'
import { composerFieldSx } from '@/styles/muiStyles.js'
import MessageBubble from './MessageBubble.jsx'
import ChatAvatar from '@/components/ui/ChatAvatar.jsx'
import { MEDIA_ACCEPT } from '@/constants/media.js'
import { BRAND_GRADIENT, BRAND_GRADIENT_HOVER } from '@/constants/theme.js'

// ==========================================================
// CHAT WINDOW - header + messages + input
//
// ---- MOBILE LAYOUT KA POORA RAAZ (ye teen line hi asli fix hain) ----
//
// Ye component apne parent `.app-shell` ke andar rehta hai. Shell ki
// height JS se aati hai aur wo hamesha utni hi hoti hai jitni SACH ME
// screen par dikh rahi hai - keyboard, URL bar aur notch, sab ghata kar
// (dekho hooks/useVisualViewport.js).
//
// Us fixed height ke andar ye ek seedha flex column hai:
//
//     header    -> shrink-0   (kabhi chhota nahi hota)
//     messages  -> flex-1 min-h-0 overflow-y-auto   (SIRF yahi scroll hota hai)
//     input     -> shrink-0   (kabhi chhota nahi hota)
//
// `min-h-0` sabse zaroori hai: flex ka default `min-height: auto` hai,
// jiski wajah se messages wali div apne content jitni BADI ho jati hai
// aur input ko neeche dhakel deti hai - screen ke bahar. Yahi purana bug tha.
//
// Iska matlab: input ke liye position:fixed, koi JS se height ka jugaad
// ya scroll par nazar rakhna - kuch nahi chahiye. Keyboard khulte hi shell
// chhoti ho jati hai aur input apne aap keyboard ke theek upar aa jata hai
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
  replyTo,
  onCancelReply,
  onOpenActions,
  onOpenMedia,
  onJumpToReply,
  highlightId,
  onOpenProfile,
  onBack,
  scrollRef,
  inputRef,
  hidden,
  imageInputRef,
  onFileSelected,
}) => {
  // Koi chat select nahi ki - welcome screen (sirf desktop par dikhti hai,
  // mobile par tab sidebar poori screen leta hai)
  if (!user) {
    return (
      <main className={`${hidden ? 'hidden' : 'flex'} md:flex flex-1 min-w-0 flex-col bg-app-bg`}>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
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
  //                  input khali ho -> attach ka button
  const showSend = !!editingId || text.trim().length > 0 || !!media

  return (
    <main
      className={`${hidden ? 'hidden' : 'flex'} md:flex flex-1 min-w-0 min-h-0 flex-col bg-app-bg`}
    >
      {/* ================= HEADER =================
          shrink-0  -> messages badhne par header dabta nahi
          pt-safe   -> notch / Dynamic Island / status bar ke NEECHE se shuru.
                       Iske bina iPhone par profile photo aadhi kat jati thi
          px-safe   -> landscape me notch side me aa jata hai, wahan bhi gap */}
      <header className="shrink-0 bg-app-panel border-b border-app-border pt-safe px-safe">
        <div className="flex items-center gap-2 px-2 py-2">
          <IconButton
            onClick={onBack}
            className="md:!hidden tap-target no-tap-flash"
            aria-label="Back to chats"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>

          {/* Poore header par tap karne se profile khulti hai - koi 3-dot menu nahi */}
          <button
            type="button"
            className="flex items-center gap-3 flex-1 min-w-0 text-left no-tap-flash px-1 py-1 rounded-lg hover:bg-app-hover"
            onClick={onOpenProfile}
            aria-label={isGroup ? 'Open group info' : `Open ${user.name}'s profile`}
          >
            <ChatAvatar user={user} size={40} showPresence />

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
          </button>
        </div>
      </header>

      {/* ================= MESSAGES =================
          flex-1 min-h-0 -> baaki bachi saari jagah leta hai, LEKIN usse
                            zyada kabhi nahi (min-h-0 ke bina content ke
                            saath badhkar input ko screen se bahar dhakel deta tha)

          Andar ek aur div hai jispar min-h-full + justify-end lagi hai:
          kam messages hon to wo neeche se chipakte hain (WhatsApp jaisa),
          zyada hon to normal scroll aa jata hai

          role="log" + aria-live -> screen reader naye message apne aap
          padh deta hai, poori list dobara nahi */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto thin-scroll chat-scroll px-safe"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={`Conversation with ${user.name}`}
      >
        <div className="min-h-full flex flex-col justify-end p-3 sm:p-4 space-y-2">
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
            const isMine = senderIdOf(msg) === me._id

            // ---- SYSTEM MESSAGE ----
            // App khud banati hai (block / unblock / screenshot). Bubble ki
            // jagah beech me chhota grey text, WhatsApp ki tarah
            if (msg.messageType === 'system') {
              return (
                <div key={msg._id} className="flex justify-center py-1">
                  <span className="text-[11px] text-app-muted bg-app-panel rounded-full px-3 py-1 text-center">
                    {systemLineOf(msg, { me, chatName: user.name, isGroup })} · {timeOf(msg.createdAt)}
                  </span>
                </div>
              )
            }

            // "Seen" sirf mere SABSE AAKHRI message ke neeche (Instagram jaisa),
            // aur group me bilkul nahi - wahan kai log hote hain
            const isMyLastMessage =
              isMine && !messages.slice(index + 1).some((m) => senderIdOf(m) === me._id)

            const statusLine =
              isMyLastMessage && !isGroup
                ? msg.isRead
                  ? 'Seen'
                  : user.isOnline
                  ? 'Delivered'
                  : 'Sent'
                : null

            // Saamne wale ki avatar sirf uske lagataar messages ke aakhri
            // wale par dikhti hai
            const nextMsg = messages[index + 1]
            const showAvatar =
              !isMine &&
              (!nextMsg || senderIdOf(nextMsg) !== senderIdOf(msg) || nextMsg.messageType === 'system')

            return (
              <MessageBubble
                key={msg._id}
                msg={msg}
                me={me}
                user={user}
                isMine={isMine}
                isGroup={isGroup}
                showAvatar={showAvatar}
                statusLine={statusLine}
                isEditing={editingId === msg._id}
                isHighlighted={highlightId === msg._id}
                onOpenActions={onOpenActions}
                onOpenMedia={onOpenMedia}
                onJumpToReply={onJumpToReply}
              />
            )
          })}

          {/* Typing indicator - teen bouncing dots */}
          {isTyping && (
            <div className="flex justify-start" aria-label="Typing">
              <div className="bg-app-bubble rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                <span className="w-2 h-2 bg-app-muted rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-app-muted rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-app-muted rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= COMPOSER =================
          shrink-0 -> ye kabhi dabta nahi. Messages ki list chhoti ho jayegi,
          input hamesha apni poori jagah rakhta hai */}
      <div className="shrink-0 px-safe">
        {/* ---- REPLY PREVIEW ---- */}
        {replyTo && (
          <div className="flex items-center gap-2 px-4 py-2 bg-app-panel border-t border-app-border">
            <ReplyIcon sx={{ fontSize: 16 }} className="text-brand-light shrink-0" />

            <div className="flex-1 min-w-0 border-l-2 border-brand pl-2">
              <p className="text-[11px] font-semibold text-brand-light">
                Replying to {senderIdOf(replyTo) === me._id ? 'yourself' : replyTo.sender?.name || user.name}
              </p>
              <p className="plain-text text-[11px] text-app-muted truncate">{previewOf(replyTo)}</p>
            </div>

            <IconButton size="small" onClick={onCancelReply} className="tap-target" aria-label="Cancel reply">
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </div>
        )}

        {/* ---- EDIT BANNER ---- */}
        {editingId && (
          <div className="flex items-center justify-between px-4 py-2 bg-yellow-500/10 border-t border-yellow-500/30 text-xs">
            <span className="text-yellow-400">Editing message</span>
            <Button size="small" onClick={onCancelEdit} sx={{ minHeight: 36 }}>Cancel</Button>
          </div>
        )}

        {/* ---- MEDIA PREVIEW (bhejne se pehle) ---- */}
        {media && (
          <div className="px-4 pt-3 bg-app-panel border-t border-app-border">
            <div className="relative inline-block">
              {media.type === 'image' ? (
                <img src={media.url} alt="Selected media preview" className="h-24 rounded-lg" />
              ) : (
                <video src={media.url} className="h-24 rounded-lg" muted playsInline />
              )}

              {uploading && (
                <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center gap-1">
                  <CircularProgress size={22} />
                  <span className="text-[10px] text-white">Uploading...</span>
                </div>
              )}

              {/* Upload ke beech me cancel nahi kar sakte */}
              {!uploading && (
                <IconButton
                  size="small"
                  onClick={onCancelMedia}
                  aria-label="Remove selected media"
                  sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#334155' }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </div>

            <p className="text-[11px] text-app-muted mt-1">
              {(media.file.size / (1024 * 1024)).toFixed(1)} MB · {media.type}
            </p>
          </div>
        )}

        {/* ---- INPUT ROW ---- */}
        {!canMessage ? (
          // Block ya deleted account - input ki jagah wajah dikhate hain
          <div
            className="px-4 py-4 bg-app-panel border-t border-app-border text-center"
            style={{ paddingBottom: 'calc(var(--safe-bottom) + 1rem)' }}
          >
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
          <div
            className="px-3 pt-2 bg-app-panel border-t border-app-border"
            // Home indicator / gesture bar ke upar. Keyboard khulne par
            // --safe-bottom apne aap 0 ho jati hai (index.css), isliye
            // input keyboard se bilkul chipka rehta hai - beech me gap nahi
            style={{ paddingBottom: 'calc(var(--safe-bottom) + 0.5rem)' }}
          >
            {/* Ek hi hidden file input - image aur video DONO ke liye */}
            <input
              type="file"
              accept={MEDIA_ACCEPT}
              ref={imageInputRef}
              onChange={onFileSelected}
              className="hidden"
              tabIndex={-1}
            />

            {/* Saare buttons input ke ANDAR hain (Instagram jaisa) */}
            <div className="flex items-end gap-1 bg-app-bg rounded-3xl pl-4 pr-1.5 py-1 no-zoom-input">
              <InputBase
                inputRef={inputRef}
                value={text}
                onChange={onTextChange}
                // multiline = lamba message likhne par box khud badhta hai.
                // maxRows se wo poori screen nahi kha jata
                multiline
                maxRows={5}
                onKeyDown={(e) => {
                  // Shift+Enter = nayi line, akela Enter = bhej do.
                  // Mobile keyboard par Enter aksar newline hi hota hai,
                  // isliye Send button hamesha dikhta hai
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onSend()
                  }
                  if (e.key === 'Escape') {
                    onCancelEdit()
                    onCancelReply()
                  }
                }}
                placeholder={editingId ? 'Edit message...' : 'Message...'}
                className="plain-text flex-1 text-sm"
                // composerFieldSx placeholder/text ko send button ke
                // theek beech me rakhta hai - wajah muiStyles.js me likhi hai
                sx={composerFieldSx}
                inputProps={{
                  'aria-label': editingId ? 'Edit message' : 'Type a message',
                  // Mobile keyboard par Enter ki jagah "send" ka icon
                  enterKeyHint: 'send',
                  // Chat me autocorrect theek hai, lekin pehla akshar
                  // apne aap bada karna naam/username me galat hota hai
                  autoCapitalize: 'sentences',
                }}
              />

              {showSend ? (
                <IconButton
                  title={editingId ? 'Save' : 'Send'}
                  aria-label={editingId ? 'Save edit' : 'Send message'}
                  onClick={onSend}
                  disabled={sending}
                  // ---- KEYBOARD KHULA RAKHNE KA ASLI TRICK ----
                  // Button par tap karte hi browser focus input se hata kar
                  // button par le jata hai - aur keyboard band ho jata hai.
                  // mousedown ka default rokne se focus hilta hi nahi
                  // (mobile browser tap par bhi yahi mousedown bhejte hain)
                  onMouseDown={(e) => e.preventDefault()}
                  className="tap-target"
                  sx={{
                    background: BRAND_GRADIENT,
                    color: 'white',
                    width: 40, height: 40,
                    '&:hover': { background: BRAND_GRADIENT_HOVER },
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
                // Ek hi button - photo aur video dono iske through jate hain
                <IconButton
                  title="Send photo or video (image max 5 MB, video max 20 MB and 10 seconds)"
                  aria-label="Attach photo or video"
                  onClick={onPickMedia}
                  className="tap-target"
                  sx={{ width: 40, height: 40 }}
                >
                  <AttachFileIcon sx={{ fontSize: 20 }} />
                </IconButton>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default ChatWindow
