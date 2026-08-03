import { useState, useEffect, useRef, useCallback } from 'react'
import { api, uploadFile } from '../api/client.js'
import { validateMediaFile } from '../utils/media.js'

// ==========================================================
// useMessages - EK KHULI HUI CHAT ka saara kaam
//
// Messages load karna, bhejna, reply, edit, forward, delete aur
// "typing..." bhejna. Sidebar ka kaam isme nahi hai - wo useChatList me hai
// ==========================================================

// Itne px se neeche ho to maan lete hain ki user "neeche hi hai" aur naye
// message par apne aap scroll kar dena chahiye. Isse zyada upar hai matlab
// purani baatein padh raha hai - use disturb nahi karte
const STICK_THRESHOLD = 120

// Reply par tap karke original tak jaane ke baad wo itni der chamakta hai
const HIGHLIGHT_MS = 1500

export const useMessages = ({
  me,
  socket,
  selectedId,
  selectedUser,
  selectedRef,
  loadingUsers,
  keyboardHeight,
  setGroups,
  setConversations,
  loadConversations,
  toast,
}) => {
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [text, setText] = useState('')
  const [media, setMedia] = useState(null)     // { file, url, type }
  const [editingId, setEditingId] = useState(null)
  const [replyTo, setReplyTo] = useState(null) // jis message ka jawab de rahe hain
  const [typingUserId, setTypingUserId] = useState(null)
  const [highlightId, setHighlightId] = useState(null)

  const scrollRef = useRef(null)      // messages wala scroll box
  const inputRef = useRef(null)       // send ke baad wapas focus dene ke liye
  const forceScrollRef = useRef(true) // true = agle render par pakka neeche jao
  const atBottomRef = useRef(true)    // user abhi neeche hi hai?

  // Typing event bar-bar na jaye, iske liye
  const typingTimerRef = useRef(null)
  const typingSentRef = useRef(false)

  // ==========================================================
  // SCROLL
  //
  // Purana code sirf `messages` badalne par scroll karta tha. Us se teen
  // dikkatein thin:
  //   1. keyboard khulne par messages wali jagah chhoti ho jati thi aur
  //      aakhri message keyboard ke peeche chala jata tha
  //   2. image/video baad me load hoke height badha dete the -> chat kood jati thi
  //   3. message bhejte hi list neeche khisak jati thi
  //
  // Ab teeno jagah ek hi jagah se scroll hota hai
  // ==========================================================
  const scrollToBottom = useCallback((behavior = 'auto') => {
    const box = scrollRef.current
    if (!box) return

    box.scrollTo({ top: box.scrollHeight, behavior })
    atBottomRef.current = true
  }, [])

  // User khud scroll kare to yaad rakho wo neeche hai ya upar.
  // passive: true -> browser ko pata hai ki hum scroll rokenge nahi,
  // isliye wo scrolling ko block kiye bina handler chalata hai (smooth rehta hai)
  useEffect(() => {
    const box = scrollRef.current
    if (!box) return

    const onScroll = () => {
      const distance = box.scrollHeight - box.scrollTop - box.clientHeight
      atBottomRef.current = distance < STICK_THRESHOLD
    }

    box.addEventListener('scroll', onScroll, { passive: true })
    return () => box.removeEventListener('scroll', onScroll)
  }, [selectedId])

  // Content ki height badalne par (image load hui, bubble bada hua,
  // typing dots aaye) - agar user neeche tha to neeche hi rakho.
  // ResizeObserver hi sahi tarika hai: scroll event image load par nahi aata
  useEffect(() => {
    const box = scrollRef.current
    if (!box || typeof ResizeObserver === 'undefined') return

    const content = box.firstElementChild
    if (!content) return

    const observer = new ResizeObserver(() => {
      if (atBottomRef.current || forceScrollRef.current) {
        box.scrollTop = box.scrollHeight
        forceScrollRef.current = false
      }
    })

    observer.observe(content)
    return () => observer.disconnect()
  }, [selectedId])

  // Keyboard khulte/band hote hi list ki height badal jati hai.
  // User neeche tha to aakhri message dobara dikhna chahiye - warna wo
  // keyboard ke peeche chhup jata hai
  useEffect(() => {
    if (atBottomRef.current) scrollToBottom()
  }, [keyboardHeight, scrollToBottom])

  // ==========================================================
  // SELECTED USER KE MESSAGES
  // ==========================================================
  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }

    // Refresh ke turant baad selectedId to mil jati hai lekin allRows
    // (users/groups) load hone me time lagta hai. Tab tak ruk jao - warna
    // group chat galti se PRIVATE endpoint se load ho jayegi
    if (!selectedUser && loadingUsers) return

    const loadMessages = async () => {
      setLoadingMessages(true)
      try {
        const isGroup = !!selectedRef.current?.isGroup
        const base = isGroup ? `/messages/group/${selectedId}` : `/messages/${selectedId}`

        const data = await api(base)
        setMessages(data.messages)

        // Chat kholi matlab messages padh liye - server ko bata do
        await api(isGroup ? `${base}/read` : `/messages/${selectedId}/read`, { method: 'PUT' })

        // Sidebar ka unread badge hata do
        if (isGroup) {
          setGroups((prev) => prev.map((g) => (g._id === selectedId ? { ...g, unreadCount: 0 } : g)))
        } else {
          setConversations((prev) =>
            prev[selectedId] ? { ...prev, [selectedId]: { ...prev[selectedId], unreadCount: 0 } } : prev
          )
        }
      } catch (err) {
        toast.setError(err.message)
      } finally {
        setLoadingMessages(false)
      }
    }

    loadMessages()
  }, [selectedId, selectedUser?.isGroup, loadingUsers])

  // Nayi chat kholi - hamesha sabse neeche se shuru, aur purani chat ka
  // reply/edit saaf
  useEffect(() => {
    forceScrollRef.current = true
    atBottomRef.current = true
    setReplyTo(null)
    setHighlightId(null)
  }, [selectedId])

  // Naya message aaya ya list badli
  useEffect(() => {
    if (forceScrollRef.current) {
      scrollToBottom()
      forceScrollRef.current = false
      return
    }

    // User purane messages padh raha ho to use beech me se mat uthao
    if (atBottomRef.current) scrollToBottom('smooth')
  }, [messages, typingUserId, loadingMessages, scrollToBottom])

  // ==========================================================
  // REPLY
  // ==========================================================
  const startReply = useCallback((msg) => {
    setReplyTo(msg)
    setEditingId(null)

    // Reply chunte hi seedha likhna shuru kar sako - mobile par keyboard
    // apne aap khul jata hai. Ek frame ruk kar focus dete hain, warna
    // sheet band hone ki animation focus cheen leti hai
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const cancelReply = useCallback(() => setReplyTo(null), [])

  // Reply ke quote par tap - original message tak le jao aur chamka do
  const jumpToMessage = useCallback((id) => {
    const el = document.getElementById(`msg-${id}`)

    if (!el) {
      // Bahut purana message ho sakta hai jo abhi load nahi hua (hum
      // aakhri 100 hi laate hain) - jhooth mat bolo, saaf bata do
      toast.setInfo('Original message is not loaded')
      return
    }

    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setHighlightId(id)

    setTimeout(() => setHighlightId((current) => (current === id ? null : current)), HIGHLIGHT_MS)
  }, [toast])

  // ==========================================================
  // TYPING
  // ==========================================================
  const handleTextChange = (e) => {
    setText(e.target.value)

    if (!socket || !selectedId) return

    const target = selectedUser?.isGroup ? { groupId: selectedId } : { receiverId: selectedId }

    // Har keystroke par event bhejne ki zarurat nahi - ek baar bhej do
    if (!typingSentRef.current) {
      socket.emit('typing', target)
      typingSentRef.current = true
    }

    // 1.5 second tak kuch na type kiya to "stop typing" bhej do
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      socket.emit('stop-typing', target)
      typingSentRef.current = false
    }, 1500)
  }

  // ==========================================================
  // MEDIA
  // Ek hi attach button hai - validateMediaFile khud file.type dekhkar
  // image/video ka farak kar leta hai
  // ==========================================================
  const handleFileSelected = async (e) => {
    const file = e.target.files[0]
    e.target.value = '' // same file dobara select kar sake isliye reset
    if (!file) return

    const result = await validateMediaFile(file)

    if (!result.ok) toast.setError(result.error)
    else setMedia(result)
  }

  // media ki taazi value ek ref me bhi rakhte hain, taaki cancelMedia
  // ko useCallback([]) me rakha ja sake aur wo phir bhi purani value par
  // atke nahi (stale closure)
  const mediaRef = useRef(null)
  mediaRef.current = media

  const cancelMedia = useCallback(() => {
    // Preview ke liye banaya hua blob URL wapas kar dete hain, warna
    // chuni hui har file browser ki memory me padi rehti hai
    if (mediaRef.current) URL.revokeObjectURL(mediaRef.current.url)
    setMedia(null)
  }, [])

  // ==========================================================
  // SEND
  //   1. Media hai to pehle Cloudinary par upload -> URL milta hai
  //   2. Us URL ke saath message database me save
  //   3. Server Socket.IO se receiver ko turant bhej deta hai
  // ==========================================================
  const sendMessage = async () => {
    if (!selectedId) return
    if (editingId) return saveEdit()

    const trimmed = text.trim()
    if (!trimmed && !media) return

    const isGroup = !!selectedUser?.isGroup
    const targetField = isGroup ? { group: selectedId } : { receiver: selectedId }

    // Reply sirf PEHLE message par lagta hai. Photo + caption ek saath
    // bheji ho to dono par lagana ajeeb lagta hai
    const replyId = replyTo?._id || null

    setSending(true)
    try {
      const newMessages = []

      if (media) {
        setUploading(true)

        // File backend ko jati hai, backend Cloudinary par bhejta hai.
        // Cloudinary ki secret keys frontend me kabhi nahi aati
        const uploaded = await uploadFile(media.file)
        setUploading(false)

        const mediaRes = await api('/messages', {
          method: 'POST',
          body: {
            ...targetField,
            messageType: uploaded.messageType,
            mediaUrl: uploaded.mediaUrl,
            mediaPublicId: uploaded.mediaPublicId,
            replyTo: replyId,
          },
        })

        newMessages.push(mediaRes.message)
      }

      if (trimmed) {
        const textRes = await api('/messages', {
          method: 'POST',
          body: {
            ...targetField,
            text: trimmed,
            messageType: 'text',
            // Media ke saath bheja to reply usi par lag chuka hai
            replyTo: media ? null : replyId,
          },
        })

        newMessages.push(textRes.message)
      }

      forceScrollRef.current = true
      setMessages((prev) => [...prev, ...newMessages])

      const last = newMessages[newMessages.length - 1]

      // Sidebar update
      if (isGroup) {
        setGroups((prev) => prev.map((g) => (g._id === selectedId ? { ...g, lastMessage: last } : g)))
      } else {
        // ab ye "Chats" tab me aa jayega kyunki maine reply kiya
        setConversations((prev) => ({
          ...prev,
          [selectedId]: {
            ...(prev[selectedId] || { unreadCount: 0, theyMessaged: false }),
            userId: selectedId,
            lastMessage: last,
            iReplied: true,
          },
        }))
      }

      setText('')
      setReplyTo(null)
      cancelMedia()

      // Bhejne ke baad keyboard khula rehna chahiye (WhatsApp jaisa) -
      // ek ke baad ek message bhejna aasan rehta hai. Send button par
      // mousedown ka default pehle hi roka hua hai (ChatWindow.jsx),
      // ye uska dohra bima hai
      inputRef.current?.focus()

      clearTimeout(typingTimerRef.current)
      typingSentRef.current = false
      socket?.emit('stop-typing', isGroup ? { groupId: selectedId } : { receiverId: selectedId })
    } catch (err) {
      toast.setError(err.message)
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  // ==========================================================
  // FORWARD
  // Ek message ko doosri chat/group me bhejna
  //
  // mediaPublicId JAAN-BOOJHKAR nahi bhejte - server bhi use khali kar
  // deta hai. Warna forward delete karne par Cloudinary se ASLI file bhi
  // ud jati aur original message me tooti image reh jati
  // ==========================================================
  const forwardMessage = async (msg, targets) => {
    const results = await Promise.allSettled(
      targets.map((target) =>
        api('/messages', {
          method: 'POST',
          body: {
            ...(target.isGroup ? { group: target._id } : { receiver: target._id }),
            messageType: msg.messageType,
            text: msg.messageType === 'text' ? msg.text : '',
            mediaUrl: msg.mediaUrl || '',
            isForwarded: true,
          },
        })
      )
    )

    const failed = results.filter((r) => r.status === 'rejected').length

    // Jis chat me forward kiya wahi khuli ho to message turant dikhna chahiye
    results.forEach((result, i) => {
      if (result.status !== 'fulfilled') return
      if (targets[i]._id !== selectedId) return

      forceScrollRef.current = true
      setMessages((prev) => [...prev, result.value.message])
    })

    await loadConversations()

    return { sent: results.length - failed, failed }
  }

  // ==========================================================
  // SCREENSHOT NOTICE
  // Detection ka kaam useScreenshotDetect karta hai - yahan sirf
  // server ko batate hain ki system message bana do
  // ==========================================================
  const notifyScreenshot = useCallback(async () => {
    if (!selectedId) return

    try {
      const isGroup = !!selectedRef.current?.isGroup
      const res = await api('/messages/screenshot', {
        method: 'POST',
        body: isGroup ? { group: selectedId } : { receiver: selectedId },
      })

      // Server ne 5 second wale dedupe me skip kar diya - kuch mat karo
      if (!res.message) return

      forceScrollRef.current = true
      setMessages((prev) => [...prev, res.message])
    } catch {
      // Ye ek chhoti si soochna hai - fail ho jaye to user ko error
      // dikhane ka koi matlab nahi, usne to bas screenshot liya tha
    }
  }, [selectedId, selectedRef])

  // ==========================================================
  // EDIT / DELETE
  // ==========================================================
  const startEdit = useCallback((msg) => {
    setEditingId(msg._id)
    setText(msg.text)
    setReplyTo(null)
    cancelMedia()

    requestAnimationFrame(() => inputRef.current?.focus())
  }, [cancelMedia])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setText('')
  }, [])

  const saveEdit = async () => {
    const trimmed = text.trim()
    if (!trimmed) {
      toast.setError('Message cannot be empty')
      return
    }

    setSending(true)
    try {
      const data = await api(`/messages/${editingId}`, { method: 'PUT', body: { text: trimmed } })
      setMessages((prev) => prev.map((m) => (m._id === editingId ? data.message : m)))
      cancelEdit()
      toast.setInfo('Message updated')
    } catch (err) {
      toast.setError(err.message)
    } finally {
      setSending(false)
    }
  }

  // Unsend = dono taraf se message poori tarah gayab (sirf apne message par)
  const unsendMessage = async (msg) => {
    try {
      await api(`/messages/${msg._id}`, { method: 'DELETE' })
      setMessages((prev) => prev.filter((m) => m._id !== msg._id))
      if (editingId === msg._id) cancelEdit()
      if (replyTo?._id === msg._id) setReplyTo(null)
      loadConversations()
    } catch (err) {
      toast.setError(err.message)
    }
  }

  // Delete for me = sirf MERI screen se hatta hai, saamne wale ko dikhta rehta hai
  const deleteForMe = async (msg) => {
    try {
      await api(`/messages/${msg._id}/me`, { method: 'DELETE' })
      setMessages((prev) => prev.filter((m) => m._id !== msg._id))
      if (replyTo?._id === msg._id) setReplyTo(null)
      loadConversations()
      toast.setInfo('Deleted for you')
    } catch (err) {
      toast.setError(err.message)
    }
  }

  // Kisi ek banda ko bheje hue SAARE messages unsend karna
  const unsendAllTo = async (userId) => {
    const res = await api(`/messages/all/${userId}`, { method: 'DELETE' })

    // Apni screen se bhi apne messages hata do
    setMessages((prev) => prev.filter((m) => m.sender !== me._id))
    await loadConversations()

    return res.deletedCount
  }

  const copyMessage = async (msg) => {
    const value = msg.text || msg.mediaUrl || ''

    try {
      // clipboard API sirf HTTPS (ya localhost) par milti hai
      if (!navigator.clipboard) throw new Error('no clipboard')

      await navigator.clipboard.writeText(value)
      toast.setInfo('Copied')
    } catch {
      toast.setError('Could not copy')
    }
  }

  return {
    messages, setMessages,
    loadingMessages, sending, uploading,
    text, setText, handleTextChange,
    media, handleFileSelected, cancelMedia,
    editingId, startEdit, cancelEdit,
    replyTo, startReply, cancelReply, jumpToMessage, highlightId,
    typingUserId, setTypingUserId,
    scrollRef, inputRef, scrollToBottom,
    sendMessage, forwardMessage, notifyScreenshot,
    unsendMessage, deleteForMe, unsendAllTo, copyMessage,
  }
}
