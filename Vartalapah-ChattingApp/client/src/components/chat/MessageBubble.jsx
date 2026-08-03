import { memo } from 'react'
import { Avatar, IconButton } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import ForwardIcon from '@mui/icons-material/Forward'
import { timeOf, previewOf, senderIdOf } from '../../utils/format.js'
import { useLongPress } from '../../hooks/useLongPress.js'

// ==========================================================
// MESSAGE BUBBLE - ek message
//
// Alag file me isliye hai ki ise React.memo me lapeta ja sake.
// Pehle saare messages ek hi component me the: ek naya message aane par
// 100 purane bubbles bhi dobara render hote the. Ab sirf wahi bubble
// dobara render hota hai jiska data sach me badla ho
//
// Isi wajah se saare handlers parent me useCallback se aate hain -
// warna har render par naya function banta aur memo bekaar ho jata
// ==========================================================

// Reply wale quote ka chhota preview
const ReplyQuote = ({ replyTo, me, isMine, onJump }) => {
  if (!replyTo) return null

  const authorId = senderIdOf(replyTo)
  const author = authorId === me._id ? 'You' : replyTo.sender?.name || 'Them'

  return (
    <button
      type="button"
      onClick={(e) => {
        // Bubble ka apna long-press/click yahan tak na pahunche
        e.stopPropagation()
        onJump(replyTo._id)
      }}
      // Quote apne aap me ek link jaisa hai - keyboard se bhi chalna chahiye
      aria-label={`Jump to message from ${author}`}
      className={`w-full text-left mb-1 pl-2 py-1 rounded border-l-2 ${
        isMine ? 'border-white/70 bg-black/15' : 'border-brand bg-black/10'
      }`}
    >
      <span className={`block text-[11px] font-semibold ${isMine ? 'text-white/90' : 'text-brand-light'}`}>
        {author}
      </span>
      <span className={`plain-text block text-[11px] truncate ${isMine ? 'text-white/70' : 'text-app-muted'}`}>
        {previewOf(replyTo)}
      </span>
    </button>
  )
}

const MessageBubble = ({
  msg,
  me,
  user,
  isMine,
  isGroup,
  showAvatar,
  statusLine,
  isEditing,
  isHighlighted,
  onOpenActions,
  onOpenMedia,
  onJumpToReply,
}) => {
  // Long press (mobile) aur right click (desktop) - dono se wahi menu
  const pressHandlers = useLongPress({
    onLongPress: (point) => onOpenActions(msg, point),
    // Photo/video par normal tap se full screen viewer khulta hai
    onClick: msg.messageType === 'image' || msg.messageType === 'video'
      ? () => onOpenMedia(msg)
      : undefined,
  })

  const isMedia = msg.messageType === 'image' || msg.messageType === 'video'

  // 3-dot button sirf desktop par (hover par). Mobile par long press hai -
  // har bubble par button lagane se chat bhadd dikhti hai
  const menuButton = (
    <IconButton
      size="small"
      className="!hidden md:!inline-flex opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      onClick={(e) => {
        e.stopPropagation()
        const box = e.currentTarget.getBoundingClientRect()
        onOpenActions(msg, { x: box.left, y: box.bottom })
      }}
      aria-label="Message options"
    >
      <MoreVertIcon sx={{ fontSize: 16 }} />
    </IconButton>
  )

  return (
    <div id={`msg-${msg._id}`} className={isHighlighted ? 'msg-highlight' : undefined}>
      <div className={`group flex items-end gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
        {isMine && menuButton}

        {/* Saamne wale ki chhoti avatar - sirf uske lagataar messages ke
            AAKHRI wale par dikhti hai. Baaki par jagah khali chhodte hain
            (visibility:hidden) taaki bubbles baayein-daayein na hilein */}
        {!isMine && (
          <Avatar
            src={isGroup ? msg.sender?.profileImage : user.profileImage}
            aria-hidden="true"
            sx={{
              width: 26, height: 26, bgcolor: '#7c3aed', fontSize: 12,
              visibility: showAvatar ? 'visible' : 'hidden',
            }}
          >
            {(isGroup ? msg.sender?.name : user.name)?.[0]}
          </Avatar>
        )}

        {/* no-callout: iOS/Android ka apna "Copy / Look Up" popup band -
            uski jagah hamara apna action sheet aata hai */}
        <div
          {...pressHandlers}
          role="button"
          tabIndex={0}
          // Keyboard wale user ke liye long press ka barabar rasta
          onKeyDown={(e) => {
            if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
              e.preventDefault()
              const box = e.currentTarget.getBoundingClientRect()
              onOpenActions(msg, { x: box.left, y: box.bottom })
            }
          }}
          aria-label={`${isMine ? 'You' : msg.sender?.name || user.name} at ${timeOf(msg.createdAt)}. ${
            isMedia ? `${msg.messageType} message` : msg.text
          }`}
          className={`no-callout max-w-[78%] sm:max-w-[75%] rounded-2xl text-sm cursor-pointer ${
            isMedia ? 'p-1' : 'px-3 py-2'
          } ${
            isMine
              ? 'brand-gradient text-white rounded-br-sm'
              : 'bg-app-bubble text-app-text rounded-bl-sm'
          } ${isEditing ? 'ring-2 ring-yellow-400' : ''}`}
        >
          {/* Group me har message ke upar bhejne wale ka naam.
              Private chat me iski zarurat nahi - sirf do log hain */}
          {isGroup && !isMine && (
            <p className={`text-[11px] font-semibold text-brand-light ${isMedia ? 'px-2 pt-1' : 'mb-0.5'}`}>
              {msg.sender?.name || 'Unknown'}
            </p>
          )}

          {msg.isForwarded && (
            <p
              className={`flex items-center gap-0.5 text-[10px] italic mb-0.5 ${
                isMine ? 'text-white/70' : 'text-app-muted'
              } ${isMedia ? 'px-2 pt-1' : ''}`}
            >
              <ForwardIcon sx={{ fontSize: 12 }} /> Forwarded
            </p>
          )}

          <ReplyQuote replyTo={msg.replyTo} me={me} isMine={isMine} onJump={onJumpToReply} />

          {/* plain-text = normal system font. Chat me display font
              padhne me mushkil hota hai */}
          {msg.messageType === 'text' && (
            <p className="plain-text whitespace-pre-wrap break-words">{msg.text}</p>
          )}

          {msg.messageType === 'image' && (
            <img
              src={msg.mediaUrl}
              alt="Photo message. Tap to open"
              loading="lazy"
              draggable={false}
              className="rounded-xl max-w-full max-h-64 object-cover pointer-events-none"
            />
          )}

          {msg.messageType === 'video' && (
            <div className="relative">
              {/* Chat me poora video player nahi - sirf pehla frame aur play
                  icon. Tap karne par full screen viewer khulta hai.
                  preload="metadata" se sirf pehla frame aata hai, poora
                  video nahi (mobile data bachta hai) */}
              <video
                src={msg.mediaUrl}
                preload="metadata"
                muted
                playsInline
                className="rounded-xl max-w-full max-h-64 pointer-events-none"
              />
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <PlayCircleIcon sx={{ fontSize: 44, color: 'rgba(255,255,255,0.92)' }} />
              </span>
            </div>
          )}

          <div
            className={`plain-text flex items-center justify-end gap-1 ${
              isMedia ? 'px-2 pb-1' : 'mt-1'
            } ${isMine ? 'text-white/70' : 'text-app-muted'}`}
          >
            {msg.isEdited && <span className="text-[10px] italic">edited</span>}
            <span className="text-[10px]">{timeOf(msg.createdAt)}</span>
          </div>
        </div>

        {!isMine && menuButton}
      </div>

      {/* ---- MESSAGE STATUS (Instagram jaisa) ----
          Sent      = database me pahunch gaya, banda offline hai
          Delivered = banda online hai lekin chat kholi nahi
          Seen      = padh liya
          Sirf mere SABSE AAKHRI message ke neeche dikhta hai */}
      {statusLine && (
        <p
          className={`plain-text text-[10px] text-right mt-0.5 mr-1 ${
            statusLine === 'Seen' ? 'text-brand-light font-medium' : 'text-app-muted'
          }`}
        >
          {statusLine}
        </p>
      )}
    </div>
  )
}

// React.memo default me saare props shallow compare karta hai. Yahan wo
// kaafi hai kyunki parent saare callbacks useCallback se bhejta hai aur
// msg object tabhi badalta hai jab message sach me badle
export default memo(MessageBubble)
