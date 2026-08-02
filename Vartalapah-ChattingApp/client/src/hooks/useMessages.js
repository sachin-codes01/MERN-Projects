import { useState, useEffect, useRef } from 'react'
import { api, uploadFile } from '../api/client.js'
import { validateMediaFile } from '../utils/media.js'

// ==========================================================
// useMessages - EK KHULI HUI CHAT ka saara kaam
//
// Messages load karna, bhejna, edit, delete aur "typing..." bhejna
// Sidebar ka kaam isme nahi hai - wo useChatList me hai
// ==========================================================
export const useMessages = ({
  me,
  socket,
  selectedId,
  selectedUser,
  selectedRef,
  loadingUsers,
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
  const [media, setMedia] = useState(null) // { file, url, type }
  const [editingId, setEditingId] = useState(null)
  const [typingUserId, setTypingUserId] = useState(null)

  // Chat neeche tak scroll karne ke liye
  const scrollRef = useRef(null)        // messages wala scroll box
  const forceScrollRef = useRef(true)   // true = agle render par pakka neeche jao

  // Typing event bar-bar na jaye, iske liye
  const typingTimerRef = useRef(null)
  const typingSentRef = useRef(false)

  // ==========================================================
  // SELECTED USER KE MESSAGES
  // ==========================================================
  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }

    // Refresh ke turant baad selectedId localStorage se turant mil jaata hai,
    // lekin allRows (users/groups) load hone me thoda time lagta hai. Tab tak
    // ruk jao - warna group chat galti se PRIVATE endpoint se load ho jayegi
    if (!selectedUser && loadingUsers) return

    const loadMessages = async () => {
      setLoadingMessages(true)
      try {
        // Group aur private chat ke alag alag routes hain
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

  // ==========================================================
  // AUTO-SCROLL (WhatsApp/Instagram jaisa)
  // ==========================================================
  useEffect(() => {
    forceScrollRef.current = true
  }, [selectedId])

  useEffect(() => {
    const box = scrollRef.current
    if (!box) return

    // Chat abhi khuli hai ya maine khud message bheja -> bina animation seedha neeche
    if (forceScrollRef.current) {
      box.scrollTop = box.scrollHeight
      forceScrollRef.current = false
      return
    }

    // Warna sirf tab neeche jao jab user pehle se neeche ki taraf ho
    // Agar wo purane messages padh raha hai to use disturb nahi karte
    const distanceFromBottom = box.scrollHeight - box.scrollTop - box.clientHeight
    if (distanceFromBottom < 150) {
      box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, typingUserId, loadingMessages])

  // ==========================================================
  // TYPING
  // ==========================================================
  const handleTextChange = (e) => {
    setText(e.target.value)

    if (!socket || !selectedId) return

    // Group hai to groupId bhejte hain, warna receiverId
    const target = selectedUser?.isGroup
      ? { groupId: selectedId }
      : { receiverId: selectedId }

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
  // Ek hi attach button hai, isliye image/video ka farak
  // validateMediaFile khud file.type dekhkar kar leta hai
  //
  // Ek baar me sirf EK file bhej sakte ho - input par "multiple" nahi lagaya
  // Image max 5 MB, video max 20 MB aur 10 second
  // ==========================================================
  const handleFileSelected = async (e) => {
    const file = e.target.files[0]
    e.target.value = '' // same file dobara select kar sake isliye reset
    if (!file) return

    const result = await validateMediaFile(file)

    if (!result.ok) toast.setError(result.error)
    else setMedia(result)
  }

  const cancelMedia = () => {
    if (media) URL.revokeObjectURL(media.url)
    setMedia(null)
  }

  // ==========================================================
  // SEND
  // Poora flow:
  //   1. Media hai to pehle Cloudinary par upload karo -> URL milta hai
  //   2. Us URL ke saath message database me save karo
  //   3. Server Socket.IO se receiver ko turant bhej deta hai
  // ==========================================================
  const sendMessage = async () => {
    if (!selectedId) return
    if (editingId) return saveEdit()

    const trimmed = text.trim()
    if (!trimmed && !media) return

    const isGroup = !!selectedUser?.isGroup

    // Message ya to group me jata hai ya kisi user ko - dono nahi
    const targetField = isGroup ? { group: selectedId } : { receiver: selectedId }

    setSending(true)
    try {
      const newMessages = []

      if (media) {
        setUploading(true)

        // File backend ko jati hai, backend Cloudinary par bhejta hai
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
          },
        })

        newMessages.push(mediaRes.message)
      }

      if (trimmed) {
        const textRes = await api('/messages', {
          method: 'POST',
          body: { ...targetField, text: trimmed, messageType: 'text' },
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
      cancelMedia()

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
  // EDIT / DELETE
  // ==========================================================
  const startEdit = (msg) => {
    setEditingId(msg._id)
    setText(msg.text)
    cancelMedia()
  }

  const cancelEdit = () => {
    setEditingId(null)
    setText('')
  }

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

  // Ek message unsend karna (confirm dialog page me dikhta hai)
  const unsendMessage = async (msg) => {
    try {
      await api(`/messages/${msg._id}`, { method: 'DELETE' })
      setMessages((prev) => prev.filter((m) => m._id !== msg._id))
      if (editingId === msg._id) cancelEdit()
      loadConversations()
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
    try {
      await navigator.clipboard.writeText(msg.text || msg.mediaUrl || '')
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
    typingUserId, setTypingUserId,
    scrollRef,
    sendMessage, unsendMessage, unsendAllTo, copyMessage,
  }
}
