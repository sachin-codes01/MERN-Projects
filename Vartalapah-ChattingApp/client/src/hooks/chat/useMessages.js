import { useState, useEffect, useRef, useCallback } from 'react'
import { messageApi } from '@/api/messageApi.js'
import { uploadApi } from '@/api/uploadApi.js'
import {
  MESSAGE_HIGHLIGHT_MS,
  SCROLL_STICK_THRESHOLD_PX,
  TYPING_IDLE_MS,
} from '@/constants/chat.js'
import { validateMediaFile } from '@/utils/mediaValidation.js'

// ==========================================================
// useMessages - EK KHULI HUI CHAT ka saara kaam
//
// Messages load karna, bhejna, reply, edit, forward, delete aur
// "typing..." bhejna. Sidebar ka kaam isme nahi hai - wo useChatList me hai
// ==========================================================

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
  // toast har render par NAYA object hota hai (useToast.js dekho), lekin
  // setError/setInfo khud React ke useState setters hain - unki identity
  // KABHI nahi badalti. Inhe yahan seedha nikaal lete hain taaki useEffect
  // ki dependency list me "toast" ki jagah inhi stable functions ko likha
  // ja sake - warna exhaustive-deps ya to warning deta, ya "toast" jodne se
  // effect har render par dobara chalta
  const { setError, setInfo } = toast

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
  const typingTargetRef = useRef(null) // { receiverId } ya { groupId } - kisko aakhri baar bheja tha

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
      atBottomRef.current = distance < SCROLL_STICK_THRESHOLD_PX
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
        const data = isGroup
          ? await messageApi.getGroupChat(selectedId)
          : await messageApi.getPrivateChat(selectedId)

        setMessages(data.messages)

        // Chat kholi matlab messages padh liye - server ko bata do
        await (isGroup
          ? messageApi.markGroupRead(selectedId)
          : messageApi.markPrivateRead(selectedId))

        // Sidebar ka unread badge hata do
        if (isGroup) {
          setGroups((prev) => prev.map((g) => (g._id === selectedId ? { ...g, unreadCount: 0 } : g)))
        } else {
          setConversations((prev) =>
            prev[selectedId] ? { ...prev, [selectedId]: { ...prev[selectedId], unreadCount: 0 } } : prev
          )
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoadingMessages(false)
      }
    }

    loadMessages()
    // selectedUser (poora object) jaan-boojhkar deps me nahi hai - sirf
    // uska .isGroup rakha hai. Wajah: selectedUser Chat.jsx me har render
    // par allRows.find() se aata hai, aur allRows kisi ke bhi online/offline
    // hote hi badal jata hai - selectedUser ko poora dep bana dete to ye
    // effect har baar messages DOBARA load karta jab kisi ka bhi presence
    // badalta, chahe khuli hui chat se koi lena-dena na ho
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedUser?.isGroup, loadingUsers, selectedRef, setGroups, setConversations, setError])

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
      setInfo('Original message is not loaded')
      return
    }

    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setHighlightId(id)

    setTimeout(() => setHighlightId((current) => (current === id ? null : current)), MESSAGE_HIGHLIGHT_MS)
  }, [setInfo])

  // ==========================================================
  // TYPING
  // ==========================================================
  const handleTextChange = (e) => {
    const value = e.target.value
    setText(value)

    if (!socket || !selectedId) return

    const target = selectedUser?.isGroup ? { groupId: selectedId } : { receiverId: selectedId }
    typingTargetRef.current = target

    // Input khali kar diya - turant "stop typing" bhejo, 1 second ka
    // wait mat karo. Warna khali box dikhne ke baad bhi "typing..." kuch
    // der saamne wale ko dikhta rehta
    if (!value.trim()) {
      clearTimeout(typingTimerRef.current)
      if (typingSentRef.current) {
        socket.emit('stop-typing', target)
        typingSentRef.current = false
      }
      return
    }

    // Har keystroke par event bhejne ki zarurat nahi - ek baar bhej do
    if (!typingSentRef.current) {
      socket.emit('typing', target)
      typingSentRef.current = true
    }

    // Itni der tak kuch na type kiya to "stop typing" bhej do
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      socket.emit('stop-typing', target)
      typingSentRef.current = false
    }, TYPING_IDLE_MS)
  }

  // Chat badli (ya poora component hi hat gaya) - purani chat ko "stop
  // typing" bata do. Warna dusri chat par chale jao aur udhar kuch type
  // kar do to purani chat wale ko hamesha ke liye "typing..." dikhta reh
  // jata, kyunki uska timeout kabhi chala hi nahi (naye selectedId ka
  // naya timer ban chuka hota hai)
  useEffect(() => {
    return () => {
      clearTimeout(typingTimerRef.current)
      if (typingSentRef.current && socket && typingTargetRef.current) {
        socket.emit('stop-typing', typingTargetRef.current)
        typingSentRef.current = false
      }
    }
  }, [selectedId, socket])

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

    if (!result.ok) setError(result.error)
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
        const uploaded = await uploadApi.uploadFile(media.file)
        setUploading(false)

        const mediaRes = await messageApi.send({
          ...targetField,
          messageType: uploaded.messageType,
          mediaUrl: uploaded.mediaUrl,
          mediaPublicId: uploaded.mediaPublicId,
          replyTo: replyId,
        })

        newMessages.push(mediaRes.message)
      }

      if (trimmed) {
        const textRes = await messageApi.send({
          ...targetField,
          text: trimmed,
          messageType: 'text',
          // Media ke saath bheja to reply usi par lag chuka hai
          replyTo: media ? null : replyId,
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
      setError(err.message)
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
        messageApi.send({
          ...(target.isGroup ? { group: target._id } : { receiver: target._id }),
          messageType: msg.messageType,
          text: msg.messageType === 'text' ? msg.text : '',
          mediaUrl: msg.mediaUrl || '',
          isForwarded: true,
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
      const res = await messageApi.notifyScreenshot(
        isGroup ? { group: selectedId } : { receiver: selectedId }
      )

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
      setError('Message cannot be empty')
      return
    }

    setSending(true)
    try {
      const data = await messageApi.edit(editingId, trimmed)
      setMessages((prev) => prev.map((m) => (m._id === editingId ? data.message : m)))
      cancelEdit()
      setInfo('Message updated')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  // Unsend = dono taraf se message poori tarah gayab (sirf apne message par)
  const unsendMessage = async (msg) => {
    try {
      await messageApi.unsend(msg._id)
      setMessages((prev) => prev.filter((m) => m._id !== msg._id))
      if (editingId === msg._id) cancelEdit()
      if (replyTo?._id === msg._id) setReplyTo(null)
      loadConversations()
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete for me = sirf MERI screen se hatta hai, saamne wale ko dikhta rehta hai
  const deleteForMe = async (msg) => {
    try {
      await messageApi.deleteForMe(msg._id)
      setMessages((prev) => prev.filter((m) => m._id !== msg._id))
      if (replyTo?._id === msg._id) setReplyTo(null)
      loadConversations()
      setInfo('Deleted for you')
    } catch (err) {
      setError(err.message)
    }
  }

  // Kisi ek banda ko bheje hue SAARE messages unsend karna
  const unsendAllTo = async (userId) => {
    const res = await messageApi.unsendAllTo(userId)

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
      setInfo('Copied')
    } catch {
      setError('Could not copy')
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
