import { useCallback, useMemo, useState } from 'react'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import ForwardIcon from '@mui/icons-material/Forward'
import IosShareIcon from '@mui/icons-material/IosShare'
import ReplyIcon from '@mui/icons-material/Reply'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { senderIdOf } from '@/utils/format.js'
import { canShare, downloadMedia, shareMedia } from '@/utils/mediaFile.js'

// ==========================================================
// useMessageActions - message par long press karne wala menu
//
// Ye hook teen cheezein ek saath sambhalta hai, kyunki teeno ek hi
// message ke ird-gird ghoomti hain:
//   1. kaunse actions dikhane hain (message ke type aur maalik ke hisaab se)
//   2. photo/video ka full screen viewer
//   3. forward wala dialog
//
// Chat.jsx me ye sab ~200 line le raha tha. Ab wahan sirf itna hai:
//   const actions = useMessageActions({ ... })
//
// Actions ki list EK hi jagah banti hai, isliye mobile ka bottom sheet
// aur desktop ka menu hamesha ek jaise rehte hain (dono ActionSheet
// component se render hote hain)
// ==========================================================
export const useMessageActions = ({ me, messages, chat, askConfirm, toast }) => {
  // Kis message par menu khula hai, aur (desktop par) kahan khola tha
  const [menu, setMenu] = useState({ message: null, point: null })

  // Viewer me kaunsi media khuli hai
  const [viewerMessageId, setViewerMessageId] = useState(null)

  // Kis message ko forward kar rahe hain
  const [forwardMessage, setForwardMessage] = useState(null)
  const [isForwarding, setIsForwarding] = useState(false)

  const openMenu = useCallback((message, point) => setMenu({ message, point }), [])
  const closeMenu = useCallback(() => setMenu({ message: null, point: null }), [])

  // ==========================================================
  // MEDIA VIEWER
  // Viewer ko is chat ki SAARI photo/video chahiye - tabhi uske andar
  // swipe karke agli-pichhli dekhi ja sakti hai (Instagram jaisa)
  // ==========================================================
  const mediaMessages = useMemo(
    () => messages.filter((m) => m.messageType === 'image' || m.messageType === 'video'),
    [messages]
  )

  const viewerIndex = useMemo(() => {
    const found = mediaMessages.findIndex((m) => m._id === viewerMessageId)
    return found === -1 ? 0 : found
  }, [mediaMessages, viewerMessageId])

  const openViewer = useCallback((message) => setViewerMessageId(message._id), [])
  const closeViewer = useCallback(() => setViewerMessageId(null), [])

  // ==========================================================
  // DOWNLOAD / SHARE
  // Dono network ka kaam karte hain, isliye dono me error handling zaroori
  // ==========================================================
  const handleDownload = useCallback(
    async (message) => {
      try {
        await downloadMedia(message)
        toast.setInfo('Download started')
      } catch (err) {
        toast.setError(err.message)
      }
    },
    [toast]
  )

  const handleShare = useCallback(
    async (message) => {
      try {
        await shareMedia(message)
      } catch (err) {
        toast.setError(err.message)
      }
    },
    [toast]
  )

  // ==========================================================
  // FORWARD
  // ==========================================================
  const startForward = useCallback((message) => setForwardMessage(message), [])
  const cancelForward = useCallback(() => setForwardMessage(null), [])

  const confirmForward = useCallback(
    async (targets) => {
      setIsForwarding(true)
      try {
        const { sent, failed } = await chat.forwardMessage(forwardMessage, targets)

        setForwardMessage(null)

        // Promise.allSettled use hota hai, isliye kuch chats fail ho sakti
        // hain aur baaki chali jati hain - user ko sach batana zaroori hai
        if (failed) toast.setError(`${failed} chat(s) could not receive the message`)
        else toast.setInfo(`Forwarded to ${sent} chat${sent > 1 ? 's' : ''}`)
      } catch (err) {
        toast.setError(err.message)
      } finally {
        setIsForwarding(false)
      }
    },
    [chat, forwardMessage, toast]
  )

  // ==========================================================
  // UNSEND (confirm ke saath)
  // Ye wapas nahi ho sakta, isliye pehle poochte hain
  // ==========================================================
  const confirmUnsend = useCallback(
    (message) => {
      askConfirm({
        title: 'Unsend message?',
        text: 'This message will be removed for both of you. This cannot be undone.',
        confirmLabel: 'Unsend',
        onYes: () => chat.unsendMessage(message),
      })
    },
    [chat, askConfirm]
  )

  // ==========================================================
  // ACTIONS KI LIST
  //
  // Order jaan-boojhkar aisa hai: pehle wo cheezein jo aksar chahiye
  // hoti hain, aur MITANE wale actions sabse neeche ek lakeer ke baad -
  // taaki galti se "Unsend" na dab jaye
  // ==========================================================
  const items = useMemo(() => {
    const message = menu.message
    if (!message) return []

    const isMine = senderIdOf(message) === me._id
    const isText = message.messageType === 'text'
    const isMedia = message.messageType === 'image' || message.messageType === 'video'

    return [
      isMedia && {
        key: 'view',
        label: 'View',
        icon: <VisibilityIcon fontSize="small" />,
        onClick: () => openViewer(message),
      },
      isMedia && {
        key: 'download',
        label: 'Download',
        subtitle: 'Original quality',
        icon: <DownloadIcon fontSize="small" />,
        onClick: () => handleDownload(message),
      },
      // Share sirf wahan jahan device sach me share kar sakta hai. Desktop
      // Firefox par ye button dabane se kuch hota hi nahi - isliye chhupa dete hain
      isMedia &&
        canShare() && {
          key: 'share',
          label: 'Share',
          icon: <IosShareIcon fontSize="small" />,
          onClick: () => handleShare(message),
        },
      {
        key: 'reply',
        label: 'Reply',
        icon: <ReplyIcon fontSize="small" />,
        onClick: () => chat.startReply(message),
      },
      isText && {
        key: 'copy',
        label: 'Copy',
        icon: <ContentCopyIcon fontSize="small" />,
        onClick: () => chat.copyMessage(message),
      },
      // Edit aur Unsend sirf apne message par. Backend par bhi yahi check
      // hai - frontend par bharosa nahi kiya jata
      isMine &&
        isText && {
          key: 'edit',
          label: 'Edit',
          icon: <EditIcon fontSize="small" />,
          onClick: () => chat.startEdit(message),
        },
      {
        key: 'forward',
        label: 'Forward',
        icon: <ForwardIcon fontSize="small" />,
        onClick: () => startForward(message),
      },

      { key: 'divider', divider: true },
      {
        key: 'delete-for-me',
        label: 'Delete for me',
        subtitle: 'Others will still see it',
        icon: <DeleteOutlineIcon fontSize="small" />,
        danger: true,
        onClick: () => chat.deleteForMe(message),
      },
      isMine && {
        key: 'unsend',
        label: 'Unsend',
        subtitle: 'Removed for everyone',
        icon: <DeleteForeverIcon fontSize="small" />,
        danger: true,
        onClick: () => confirmUnsend(message),
      },
    ].filter(Boolean) // false wali entries (jo is message par lagu nahi) hata do
  }, [menu.message, me._id, chat, openViewer, handleDownload, handleShare, startForward, confirmUnsend])

  return {
    // action sheet
    menu, items, openMenu, closeMenu,

    // media viewer
    mediaMessages, viewerIndex, isViewerOpen: !!viewerMessageId,
    openViewer, closeViewer, handleDownload, handleShare,

    // forward
    forwardMessage, isForwarding, startForward, cancelForward, confirmForward,
  }
}
