import { useEffect } from 'react'
import { messageApi } from '@/api/messageApi.js'
import { senderIdOf } from '@/utils/format.js'

// ==========================================================
// useChatSocket - REAL-TIME ka dil
//
// Server jo bhi event bhejta hai (naya message, typing, group update),
// unhe sunne ka saara code yahan ek jagah hai
//
// Do cheezein yaad rakhne layak hain (interview me poochhte hain):
//
// 1) CLEANUP zaroori hai
//    useEffect ke aakhir me socket.off() na karein to har render par
//    naya listener judta jayega aur ek message 5-5 baar dikhega
//
// 2) selectedIdRef (ref, state nahi)
//    Listeners sirf ek baar bante hain, isliye unke andar purani
//    selectedId "phans" jati hai (isse stale closure kehte hain).
//    Ref ki .current value hamesha latest hoti hai, isliye ref use kiya
// ==========================================================
export const useChatSocket = ({
  socket,
  me,
  selectedIdRef,
  setSelectedId,
  setMessages,
  setGroups,
  setConversations,
  setTypingUserId,
  refreshUsers,
  loadConversations,
  toast,
}) => {
  useEffect(() => {
    if (!socket) return

    const onNewMessage = (msg) => {
      const openChatId = selectedIdRef.current

      // ---------- GROUP MESSAGE ----------
      if (msg.group) {
        const senderId = senderIdOf(msg)

        // Apna hi message wapas aaya (main bhi group room me hoon) - dobara mat daalo
        if (senderId === me._id) return

        if (msg.group === openChatId) {
          setMessages((prev) => [...prev, msg])
          messageApi.markGroupRead(msg.group).catch(() => {})
        }

        setGroups((prev) =>
          prev.map((g) =>
            g._id === msg.group
              ? {
                  ...g,
                  lastMessage: msg,
                  unreadCount: msg.group === openChatId ? 0 : (g.unreadCount || 0) + 1,
                }
              : g
          )
        )
        return
      }

      // ---------- PRIVATE MESSAGE ----------
      // Agar usi banda ki chat abhi khuli hai to message screen par daal do
      if (msg.sender === openChatId) {
        setMessages((prev) => [...prev, msg])

        // Chat khuli hai matlab turant padh liya
        messageApi.markPrivateRead(msg.sender).catch(() => {})
      }

      // Sidebar ka last message aur unread count update karo
      setConversations((prev) => {
        const old = prev[msg.sender] || { unreadCount: 0, theyMessaged: false, iReplied: false }
        return {
          ...prev,
          [msg.sender]: {
            ...old,
            userId: msg.sender,
            lastMessage: msg,
            theyMessaged: true,
            unreadCount: msg.sender === openChatId ? 0 : (old.unreadCount || 0) + 1,
          },
        }
      })

      // Naya banda ho sakta hai (ya jise maine list se hataya tha) - list refresh
      refreshUsers()
    }

    // Kisi ne mujhe block/unblock kiya - meri screen turant update honi chahiye
    // Warna input box tab tak khula rehta jab tak main page refresh na karun
    const onRelationChanged = () => {
      refreshUsers()
    }

    // ---------- GROUP EVENTS ----------
    const onGroupCreated = (group) => {
      setGroups((prev) => (prev.some((g) => g._id === group._id) ? prev : [...prev, group]))
      toast.setInfo(`You were added to "${group.name}"`)
    }

    const onGroupUpdated = (group) => {
      setGroups((prev) => prev.map((g) => (g._id === group._id ? { ...g, ...group } : g)))
    }

    const onGroupRemoved = ({ _id }) => {
      setGroups((prev) => prev.filter((g) => g._id !== _id))
      // Wahi group khula tha to band kar do
      if (selectedIdRef.current === _id) setSelectedId(null)
    }

    const onMessageUpdated = (msg) => {
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)))

      setConversations((prev) => {
        const conv = prev[msg.sender]
        if (conv?.lastMessage?._id !== msg._id) return prev
        return { ...prev, [msg.sender]: { ...conv, lastMessage: msg } }
      })
    }

    const onMessageDeleted = ({ _id }) => {
      setMessages((prev) => prev.filter((m) => m._id !== _id))
      // Sidebar ka preview bhi refresh - warna deleted message wahan dikhta rehta hai
      loadConversations()
    }

    // Saamne wale ne apne SAARE messages unsend kar diye
    const onBulkDeleted = ({ ids }) => {
      setMessages((prev) => prev.filter((m) => !ids.includes(m._id)))
      loadConversations()
    }

    const onMessagesRead = ({ by }) => {
      if (selectedIdRef.current !== by) return
      setMessages((prev) => prev.map((m) => (m.sender === me._id ? { ...m, isRead: true } : m)))
    }

    // Group me typing par naam dikhate hain, private me sirf "typing..."
    const onTyping = ({ userId, userName, groupId }) => {
      if (groupId) {
        if (groupId === selectedIdRef.current) setTypingUserId(userName || 'Someone')
      } else if (userId === selectedIdRef.current) {
        setTypingUserId(true)
      }
    }

    const onStopTyping = ({ userId, groupId }) => {
      if (groupId ? groupId === selectedIdRef.current : userId === selectedIdRef.current) {
        setTypingUserId(null)
      }
    }

    // socket.on() -> server se aane wale events sunte hain
    socket.on('new-message', onNewMessage)
    socket.on('message-updated', onMessageUpdated)
    socket.on('message-deleted', onMessageDeleted)
    socket.on('messages-bulk-deleted', onBulkDeleted)
    socket.on('messages-read', onMessagesRead)
    socket.on('typing', onTyping)
    socket.on('stop-typing', onStopTyping)
    socket.on('relation-changed', onRelationChanged)
    socket.on('group-created', onGroupCreated)
    socket.on('group-updated', onGroupUpdated)
    socket.on('group-removed', onGroupRemoved)

    // Cleanup zaroori hai - warna har re-render par naya listener add hota rahega
    // aur ek message 5-5 baar dikhne lagega
    return () => {
      socket.off('new-message', onNewMessage)
      socket.off('message-updated', onMessageUpdated)
      socket.off('message-deleted', onMessageDeleted)
      socket.off('messages-bulk-deleted', onBulkDeleted)
      socket.off('messages-read', onMessagesRead)
      socket.off('typing', onTyping)
      socket.off('stop-typing', onStopTyping)
      socket.off('relation-changed', onRelationChanged)
      socket.off('group-created', onGroupCreated)
      socket.off('group-updated', onGroupUpdated)
      socket.off('group-removed', onGroupRemoved)
    }
  }, [socket, me._id, refreshUsers])
}
