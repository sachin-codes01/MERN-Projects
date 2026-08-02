import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Snackbar, Alert } from '@mui/material'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import { api } from '../api/client.js'

import Sidebar from '../components/chat/Sidebar.jsx'
import ChatWindow from '../components/chat/ChatWindow.jsx'
import Dialogs from '../components/chat/Dialogs.jsx'
import { CreateGroupDialog, GroupInfoDialog } from '../components/chat/GroupDialogs.jsx'

import { useToast } from '../hooks/useToast.js'
import { useChatList } from '../hooks/useChatList.js'
import { useMessages } from '../hooks/useMessages.js'
import { useChatSocket } from '../hooks/useChatSocket.js'
import { useGroupActions } from '../hooks/useGroupActions.js'
import { useProfileActions } from '../hooks/useProfileActions.js'

// ==========================================================
// CHAT PAGE
//
// Ye file khud kuch "karti" nahi hai - bas sab kuch JODTI hai:
//
//   useChatList       -> sidebar ki list (users, groups, conversations)
//   useMessages       -> khuli hui chat (load, send, edit, delete)
//   useChatSocket     -> real-time events sunna
//   useGroupActions   -> group banana/badalna/delete
//   useProfileActions -> apni profile aur account delete
//
// Aur neeche JSX me sirf teen component hain: Sidebar, ChatWindow, Dialogs
//
// Pehle ye sab ek hi file me tha (1200 lines). Ab har cheez apni
// jagah par hai - koi ek cheez samajhni ho to sirf ek chhoti file kholo
// ==========================================================
const Chat = () => {
  const navigate = useNavigate()

  // Context se logged-in user aur socket dono mil jate hain
  const { user: me, logout, updateProfile, deleteAccount } = useAuth()
  const { socket, onlineUsers } = useSocket()

  const toast = useToast()

  // ---- Sidebar ke filters ----
  const [tab, setTab] = useState('chats')
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  // "All people" tab par naye users ka badge dikhane ke liye
  // Aakhri baar wo tab kab kholi thi, ye localStorage me rakhte hain
  // (localStorage browser me save rehta hai, refresh ke baad bhi)
  const [allPeopleSeenAt, setAllPeopleSeenAt] = useState(() => {
    const saved = Number(localStorage.getItem('instachats_all_seen_at'))

    // Pehli baar app khol rahe ho to abhi ka time - warna saare users "naye" dikhenge
    if (!saved) {
      const now = Date.now()
      localStorage.setItem('instachats_all_seen_at', String(now))
      return now
    }

    return saved
  })

  // Kholi hui chat localStorage me bhi save karte hain, isliye page
  // refresh karne par bhi wahi chat khuli rehti hai (chat list par nahi phekta)
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('instachats_selected_id') || null)

  useEffect(() => {
    if (selectedId) localStorage.setItem('instachats_selected_id', selectedId)
    else localStorage.removeItem('instachats_selected_id')
  }, [selectedId])

  // ---- Menus / dialogs ka chhota state ----
  const [viewUserId, setViewUserId] = useState(null)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [groupInfoOpen, setGroupInfoOpen] = useState(false)
  const [msgMenu, setMsgMenu] = useState({ anchor: null, message: null })
  const [listMenu, setListMenu] = useState(null) // { x, y, user }
  const [confirm, setConfirm] = useState(null)

  const imageInputRef = useRef(null)
  const avatarInputRef = useRef(null)
  const groupImageInputRef = useRef(null)
  const longPressRef = useRef(null) // long press ka timer

  // Socket listeners ek hi baar bante hain, isliye unhe latest selectedId
  // ref se milti hai. Warna wo purani value yaad rakhte hain (stale closure)
  const selectedIdRef = useRef(null)
  const selectedRef = useRef(null) // poora selected row (isGroup pata karne ke liye)

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  // ---------------- HOOKS ----------------

  const list = useChatList({ me, onlineUsers, tab, search, allPeopleSeenAt, toast })

  const selectedUser = list.allRows.find((u) => u._id === selectedId) || null
  const viewUser = list.allRows.find((u) => u._id === viewUserId) || null

  // Socket listeners ke andar bhi selected row chahiye hota hai
  selectedRef.current = selectedUser

  const chat = useMessages({
    me,
    socket,
    selectedId,
    selectedUser,
    selectedRef,
    loadingUsers: list.loadingUsers,
    setGroups: list.setGroups,
    setConversations: list.setConversations,
    loadConversations: list.loadConversations,
    toast,
  })

  useChatSocket({
    socket,
    me,
    selectedIdRef,
    setSelectedId,
    setMessages: chat.setMessages,
    setGroups: list.setGroups,
    setConversations: list.setConversations,
    setTypingUserId: chat.setTypingUserId,
    refreshUsers: list.refreshUsers,
    loadConversations: list.loadConversations,
    toast,
  })

  const askConfirm = (options) => setConfirm(options)

  const group = useGroupActions({
    me,
    selectedId,
    selectedUser,
    setGroups: list.setGroups,
    setSelectedId,
    loadGroups: list.loadGroups,
    askConfirm,
    toast,
  })

  const profile = useProfileActions({
    me,
    updateProfile,
    deleteAccount,
    askConfirm,
    toast,
    onDeleted: () => navigate('/'),
  })

  // "All people" tab kholte hi naye users "dekh liye" - badge hat jata hai
  useEffect(() => {
    if (tab !== 'all') return

    const now = Date.now()
    localStorage.setItem('instachats_all_seen_at', String(now))
    setAllPeopleSeenAt(now)
  }, [tab])

  // ==========================================================
  // CHHOTE ACTIONS (jo sirf isi page ko chahiye)
  // ==========================================================

  const openChat = (u) => {
    setSelectedId(u._id)
    chat.cancelEdit()
    chat.setTypingUserId(null)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // ---- Long press / right click par chat list ka menu ----
  const handleLongPress = (e, u, isTouch) => {
    // null aaya matlab ungli hat gayi - timer cancel
    if (e === null) {
      clearTimeout(longPressRef.current)
      return
    }

    if (isTouch) {
      // Mobile: 500ms tak dabaye rakho tab menu khulta hai
      const touch = e.touches[0]
      longPressRef.current = setTimeout(() => {
        setListMenu({ x: touch.clientX, y: touch.clientY, user: u })
      }, 500)
    } else {
      // Desktop: right click par turant
      setListMenu({ x: e.clientX, y: e.clientY, user: u })
    }
  }

  // Pin / archive / block / hide - sabke liye ek hi function
  const toggleRelation = async (key, value) => {
    const target = listMenu?.user
    setListMenu(null)
    if (!target) return

    try {
      await api(`/users/${target._id}/relation`, { method: 'PUT', body: { [key]: value } })
      await list.refreshUsers()

      // List se hataya to chat band kar do
      if (key === 'hidden' && value && selectedId === target._id) setSelectedId(null)

      const labels = {
        pinned: value ? 'Pinned' : 'Unpinned',
        archived: value ? 'Archived' : 'Unarchived',
        blocked: value ? 'User blocked' : 'User unblocked',
        hidden: 'Removed from list',
      }
      toast.setInfo(labels[key])
    } catch (err) {
      toast.setError(err.message)
    }
  }

  // View profile me se block/unblock
  const handleBlockToggle = async () => {
    if (!viewUser) return

    try {
      await api(`/users/${viewUser._id}/relation`, {
        method: 'PUT',
        body: { blocked: !viewUser.isBlocked },
      })
      await list.refreshUsers()
      toast.setInfo(viewUser.isBlocked ? 'User unblocked' : 'User blocked')
    } catch (err) {
      toast.setError(err.message)
    }
  }

  // View profile me se "apne saare messages unsend karo"
  const handleUnsendAll = () => {
    const target = viewUser
    if (!target) return

    askConfirm({
      title: `Unsend all messages to ${target.name}?`,
      text: 'Every message you sent to this person will be removed for both of you. Their messages will stay. This cannot be undone.',
      confirmLabel: 'Unsend all',
      onYes: async () => {
        try {
          const count = await chat.unsendAllTo(target._id)
          setViewUserId(null)
          toast.setInfo(`${count} message(s) unsent`)
        } catch (err) {
          toast.setError(err.message)
        }
      },
    })
  }

  // ---- Message ke menu wale actions ----
  const closeMsgMenu = () => setMsgMenu({ anchor: null, message: null })

  const handleCopy = () => {
    const msg = msgMenu.message
    closeMsgMenu()
    chat.copyMessage(msg)
  }

  const handleStartEdit = () => {
    const msg = msgMenu.message
    closeMsgMenu()
    chat.startEdit(msg)
  }

  const handleUnsend = () => {
    const msg = msgMenu.message
    closeMsgMenu()

    askConfirm({
      title: 'Unsend message?',
      text: 'This message will be removed for both of you. This cannot be undone.',
      confirmLabel: 'Unsend',
      onYes: () => chat.unsendMessage(msg),
    })
  }

  const runConfirm = () => {
    confirm.onYes()
    setConfirm(null)
  }

  return (
    <div className="h-screen w-full bg-app-bg text-app-text flex">
      <Sidebar
        me={me}
        visibleUsers={list.visibleRows}
        archivedUsers={list.archivedRows}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        loading={list.loadingUsers}
        tab={tab}
        setTab={setTab}
        tabCounts={list.tabCounts}
        search={search}
        setSearch={setSearch}
        selectedUser={selectedUser}
        onOpenChat={openChat}
        onLongPress={handleLongPress}
        onOpenMyProfile={profile.openProfile}
        onNewGroup={() => setCreateGroupOpen(true)}
        hidden={!!selectedId}
      />

      <ChatWindow
        me={me}
        user={selectedUser}
        messages={chat.messages}
        loadingMessages={chat.loadingMessages}
        isTyping={chat.typingUserId === selectedId}
        text={chat.text}
        onTextChange={chat.handleTextChange}
        onSend={chat.sendMessage}
        sending={chat.sending}
        uploading={chat.uploading}
        media={chat.media}
        onPickMedia={() => imageInputRef.current.click()}
        onCancelMedia={chat.cancelMedia}
        editingId={chat.editingId}
        onCancelEdit={chat.cancelEdit}
        onMessageMenu={(e, msg) => setMsgMenu({ anchor: e.currentTarget, message: msg })}
        // Group ka header dabane par Group Info khulti hai, user ka header dabane par uski profile
        onOpenProfile={() =>
          selectedUser?.isGroup ? setGroupInfoOpen(true) : setViewUserId(selectedId)
        }
        onBack={() => setSelectedId(null)}
        scrollRef={chat.scrollRef}
        hidden={!selectedId}
        imageInputRef={imageInputRef}
        onFileSelected={chat.handleFileSelected}
      />

      <Dialogs
        me={me}
        msgMenu={msgMenu}
        onCloseMsgMenu={closeMsgMenu}
        onCopy={handleCopy}
        onStartEdit={handleStartEdit}
        onUnsend={handleUnsend}
        listMenu={listMenu}
        onCloseListMenu={() => setListMenu(null)}
        onToggleRelation={toggleRelation}
        onOpenGroupInfo={() => {
          setSelectedId(listMenu.user._id)
          setListMenu(null)
          setGroupInfoOpen(true)
        }}
        viewUser={viewUser}
        onCloseViewUser={() => setViewUserId(null)}
        onBlockToggle={handleBlockToggle}
        onUnsendAll={handleUnsendAll}
        profileOpen={profile.open}
        onCloseProfile={() => profile.setOpen(false)}
        draftProfile={profile.draft}
        setDraftProfile={profile.setDraft}
        avatarInputRef={avatarInputRef}
        onAvatarSelect={profile.handleAvatarSelect}
        onSaveProfile={profile.saveProfile}
        savingProfile={profile.saving}
        onLogout={handleLogout}
        onDeleteAccount={profile.handleDeleteAccount}
        confirm={confirm}
        onCancelConfirm={() => setConfirm(null)}
        onRunConfirm={runConfirm}
      />

      {/* ---------- GROUP DIALOGS ---------- */}
      <CreateGroupDialog
        open={createGroupOpen}
        onClose={() => { setCreateGroupOpen(false); group.setDraftImage(null) }}
        // Group me sirf un logon ko add kar sakte ho jinhe block nahi kiya
        people={list.addablePeople}
        onCreate={(name, memberIds, closeDialog) =>
          group.createGroup(name, memberIds, closeDialog, setTab)
        }
        creating={group.creatingGroup}
        groupImageInputRef={groupImageInputRef}
        onGroupImageSelect={group.handleImageSelect}
        draftImage={group.draftImage?.url}
      />

      <GroupInfoDialog
        open={groupInfoOpen}
        group={selectedUser?.isGroup ? selectedUser : null}
        me={me}
        people={list.addablePeople}
        onClose={() => { setGroupInfoOpen(false); group.setDraftImage(null) }}
        onRename={group.renameGroup}
        onRemoveMember={group.removeMember}
        onAddMembers={group.addMembers}
        onLeave={() => group.leaveGroup(() => setGroupInfoOpen(false))}
        onDelete={() => group.deleteGroup(() => setGroupInfoOpen(false))}
        groupImageInputRef={groupImageInputRef}
        onGroupImageSelect={group.handleImageSelect}
        draftImage={group.draftImage?.url}
        saving={group.savingGroup}
      />

      {/* Error message - laal */}
      <Snackbar
        open={!!toast.error}
        autoHideDuration={4000}
        onClose={() => toast.setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => toast.setError('')}>{toast.error}</Alert>
      </Snackbar>

      {/* Success message - hara */}
      <Snackbar
        open={!!toast.info}
        autoHideDuration={2500}
        onClose={() => toast.setInfo('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => toast.setInfo('')}>{toast.info}</Alert>
      </Snackbar>
    </div>
  )
}

export default Chat
