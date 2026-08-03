import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Snackbar, Alert } from '@mui/material'
import ReplyIcon from '@mui/icons-material/Reply'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import EditIcon from '@mui/icons-material/Edit'
import ForwardIcon from '@mui/icons-material/Forward'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DownloadIcon from '@mui/icons-material/Download'
import IosShareIcon from '@mui/icons-material/IosShare'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'

import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import { api } from '../api/client.js'

import Sidebar from '../components/chat/Sidebar.jsx'
import ChatWindow from '../components/chat/ChatWindow.jsx'
import Dialogs from '../components/chat/Dialogs.jsx'
import ActionSheet from '../components/chat/ActionSheet.jsx'
import MediaViewer from '../components/chat/MediaViewer.jsx'
import ForwardDialog from '../components/chat/ForwardDialog.jsx'
import { CreateGroupDialog, GroupInfoDialog } from '../components/chat/GroupDialogs.jsx'

import { useToast } from '../hooks/useToast.js'
import { useChatList } from '../hooks/useChatList.js'
import { useMessages } from '../hooks/useMessages.js'
import { useChatSocket } from '../hooks/useChatSocket.js'
import { useGroupActions } from '../hooks/useGroupActions.js'
import { useProfileActions } from '../hooks/useProfileActions.js'
import { useVisualViewport } from '../hooks/useVisualViewport.js'
import { useBackGuard } from '../hooks/useBackGuard.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { useScreenshotDetect } from '../hooks/useScreenshotDetect.js'

import { senderIdOf } from '../utils/format.js'
import { downloadMedia, shareMedia, canShare } from '../utils/media.download.js'

// ==========================================================
// CHAT PAGE
//
// Ye file khud kuch "karti" nahi hai - bas sab kuch JODTI hai:
//
//   useChatList       -> sidebar ki list (users, groups, conversations)
//   useMessages       -> khuli hui chat (load, send, reply, edit, delete)
//   useChatSocket     -> real-time events sunna
//   useGroupActions   -> group banana/badalna/delete
//   useProfileActions -> apni profile aur account delete
//
//   useVisualViewport -> mobile keyboard aur safe area (layout ki jaan)
//   useBackGuard      -> Android ka back button
//   useScreenshotDetect -> "Sachin took a screenshot."
// ==========================================================
const Chat = () => {
  const navigate = useNavigate()

  const { user: me, logout, updateProfile, deleteAccount } = useAuth()
  const { socket, onlineUsers } = useSocket()

  const toast = useToast()
  const isMobile = useIsMobile()

  // ---- MOBILE LAYOUT KI JAAN ----
  // Ye hook <html> par --app-height / --app-offset-top / --safe-* set
  // karta hai aur document ka apna scroll band kar deta hai. Poora
  // keyboard aur safe-area ka ilaaj yahi ek line hai
  const keyboard = useVisualViewport()

  // ---- Sidebar ke filters ----
  // Tab hamesha "chats" se shuru hota hai. Pehle ye localStorage me save
  // hota tha, jiski wajah se website dobara kholne par kabhi bhi kisi
  // bhi screen par khul jati thi. Ab shuruaat hamesha ek hi jagah se hoti hai
  const [tab, setTab] = useState('chats')
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  // "All people" tab par naye users ka badge dikhane ke liye
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

  // Khuli hui chat ab localStorage me SAVE NAHI hoti. Website dobara
  // kholne par hamesha Chats list milti hai - kisi purani chat ke beech
  // me nahi girte
  const [selectedId, setSelectedId] = useState(null)

  // Purani key saaf kar dete hain, warna wo browser me bekaar padi rahegi
  useEffect(() => {
    localStorage.removeItem('instachats_selected_id')
  }, [])

  // ---- Menus / dialogs ka chhota state ----
  const [viewUserId, setViewUserId] = useState(null)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [groupInfoOpen, setGroupInfoOpen] = useState(false)
  const [msgMenu, setMsgMenu] = useState({ message: null, point: null })
  const [listMenu, setListMenu] = useState(null)   // { point, user }
  const [confirm, setConfirm] = useState(null)
  const [forwardMsg, setForwardMsg] = useState(null)
  const [forwarding, setForwarding] = useState(false)
  const [viewerMsgId, setViewerMsgId] = useState(null)

  const imageInputRef = useRef(null)
  const avatarInputRef = useRef(null)
  const groupImageInputRef = useRef(null)

  // Socket listeners ek hi baar bante hain, isliye unhe latest selectedId
  // ref se milti hai. Warna wo purani value yaad rakhte hain (stale closure)
  const selectedIdRef = useRef(null)
  const selectedRef = useRef(null)

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  // ---------------- HOOKS ----------------

  const list = useChatList({ me, onlineUsers, tab, search, allPeopleSeenAt, toast })

  const selectedUser = list.allRows.find((u) => u._id === selectedId) || null
  const viewUser = list.allRows.find((u) => u._id === viewUserId) || null

  selectedRef.current = selectedUser

  const chat = useMessages({
    me,
    socket,
    selectedId,
    selectedUser,
    selectedRef,
    loadingUsers: list.loadingUsers,
    // Keyboard khulte hi messages wali jagah chhoti ho jati hai - hook
    // ise dekhkar list ko dobara sabse neeche le aata hai
    keyboardHeight: keyboard.height,
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

  // ==========================================================
  // ANDROID BACK BUTTON
  //
  // Maanga gaya flow:
  //     Chats -> Conversation --back--> Chats --back--> website band
  //
  // Har khuli hui cheez history me ek nakli entry daalti hai. Desktop par
  // chat aur list saath saath dikhte hain, isliye wahan chat wala guard
  // nahi lagta - warna back "kuch nahi karta" jaisa lagta
  // ==========================================================
  useBackGuard(isMobile && !!selectedId, () => setSelectedId(null))
  useBackGuard(isMobile && tab !== 'chats', () => setTab('chats'))

  // ==========================================================
  // SCREENSHOT
  // Browser me screenshot ka koi API nahi hai. Ye hook sirf ASLI signal
  // par chalta hai - native wrapper ka event, ya desktop ka PrintScreen /
  // Cmd+Shift+3. Baaki jagah chup rehta hai (jhootha alarm dena
  // kuch na dikhane se bura hai). Poori baat useScreenshotDetect.js me hai
  // ==========================================================
  useScreenshotDetect({
    enabled: !!selectedId,
    onScreenshot: chat.notifyScreenshot,
  })

  // "All people" tab kholte hi naye users "dekh liye" - badge hat jata hai
  useEffect(() => {
    if (tab !== 'all') return

    const now = Date.now()
    localStorage.setItem('instachats_all_seen_at', String(now))
    setAllPeopleSeenAt(now)
  }, [tab])

  // Mobile ka Profile tab bhi wahi draft use karta hai jo desktop ka
  // dialog - kholte waqt use apni asli value se bharna zaroori hai
  useEffect(() => {
    if (tab === 'profile') profile.setDraft({ name: me.name, image: me.profileImage || '' })
  }, [tab, me.name, me.profileImage])

  // ==========================================================
  // CHHOTE ACTIONS
  // ==========================================================

  const openChat = useCallback((u) => {
    setSelectedId(u._id)
    chat.cancelEdit()
    chat.setTypingUserId(null)
  }, [chat.cancelEdit, chat.setTypingUserId])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // Long press (mobile) / right click (desktop) - chat list ka menu
  const handleRowMenu = useCallback((user, point) => setListMenu({ point, user }), [])

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

  // ==========================================================
  // MEDIA VIEWER
  //
  // Viewer ko is chat ki SAARI photo/video chahiye - tabhi uske andar
  // swipe karke agli-pichhli dekh sakte hain (Instagram jaisa)
  // ==========================================================
  const mediaMessages = useMemo(
    () => chat.messages.filter((m) => m.messageType === 'image' || m.messageType === 'video'),
    [chat.messages]
  )

  const viewerIndex = useMemo(() => {
    const found = mediaMessages.findIndex((m) => m._id === viewerMsgId)
    return found === -1 ? 0 : found
  }, [mediaMessages, viewerMsgId])

  const openMedia = useCallback((msg) => setViewerMsgId(msg._id), [])

  const handleDownload = async (msg) => {
    try {
      await downloadMedia(msg)
      toast.setInfo('Download started')
    } catch (err) {
      toast.setError(err.message)
    }
  }

  const handleShare = async (msg) => {
    try {
      await shareMedia(msg)
    } catch (err) {
      toast.setError(err.message)
    }
  }

  // ==========================================================
  // MESSAGE ACTIONS
  // ==========================================================
  const openMsgMenu = useCallback((message, point) => setMsgMenu({ message, point }), [])
  const closeMsgMenu = () => setMsgMenu({ message: null, point: null })

  const handleUnsend = (msg) => {
    askConfirm({
      title: 'Unsend message?',
      text: 'This message will be removed for both of you. This cannot be undone.',
      confirmLabel: 'Unsend',
      onYes: () => chat.unsendMessage(msg),
    })
  }

  // Menu ki list message ke hisaab se banti hai. Ek hi jagah banti hai,
  // isliye mobile ke bottom sheet aur desktop ke menu me hamesha ek jaisi
  // rehti hai (ActionSheet dono shakal khud sambhalta hai)
  const messageActions = useMemo(() => {
    const msg = msgMenu.message
    if (!msg) return []

    const isMine = senderIdOf(msg) === me._id
    const isText = msg.messageType === 'text'
    const isMedia = msg.messageType === 'image' || msg.messageType === 'video'

    return [
      isMedia && {
        key: 'view',
        label: 'View',
        icon: <VisibilityIcon fontSize="small" />,
        onClick: () => openMedia(msg),
      },
      isMedia && {
        key: 'download',
        label: 'Download',
        subtitle: 'Original quality',
        icon: <DownloadIcon fontSize="small" />,
        onClick: () => handleDownload(msg),
      },
      // Share sirf wahan jahan device sach me share kar sakta hai -
      // desktop Firefox par ye button kuch nahi karta, isliye chhupa dete hain
      isMedia && canShare() && {
        key: 'share',
        label: 'Share',
        icon: <IosShareIcon fontSize="small" />,
        onClick: () => handleShare(msg),
      },
      {
        key: 'reply',
        label: 'Reply',
        icon: <ReplyIcon fontSize="small" />,
        onClick: () => chat.startReply(msg),
      },
      isText && {
        key: 'copy',
        label: 'Copy',
        icon: <ContentCopyIcon fontSize="small" />,
        onClick: () => chat.copyMessage(msg),
      },
      // Edit aur Unsend sirf apne message par. Backend par bhi yahi check
      // hai - frontend par bharosa nahi karte
      isMine && isText && {
        key: 'edit',
        label: 'Edit',
        icon: <EditIcon fontSize="small" />,
        onClick: () => chat.startEdit(msg),
      },
      {
        key: 'forward',
        label: 'Forward',
        icon: <ForwardIcon fontSize="small" />,
        onClick: () => setForwardMsg(msg),
      },

      // Mitane wale actions hamesha sabse neeche aur alag - galti se dabne
      // ka mauka kam ho jata hai
      { key: 'divider', divider: true },
      {
        key: 'delete-me',
        label: 'Delete for me',
        subtitle: 'Others will still see it',
        icon: <DeleteOutlineIcon fontSize="small" />,
        danger: true,
        onClick: () => chat.deleteForMe(msg),
      },
      isMine && {
        key: 'unsend',
        label: 'Unsend',
        subtitle: 'Removed for everyone',
        icon: <DeleteForeverIcon fontSize="small" />,
        danger: true,
        onClick: () => handleUnsend(msg),
      },
    ].filter(Boolean)
  }, [msgMenu.message, me._id, chat.startReply, chat.copyMessage, chat.startEdit, chat.deleteForMe, openMedia])

  // ---- FORWARD ----
  // Sirf unhi logon ko forward kar sakte ho jinse baat ho sakti hai
  const forwardTargets = useMemo(
    () => list.allRows.filter((row) => row.isGroup || (!row.isDeleted && row.canMessage && !row.isHidden)),
    [list.allRows]
  )

  const handleForward = async (targetIds) => {
    const targets = forwardTargets.filter((t) => targetIds.includes(t._id))

    setForwarding(true)
    try {
      const { sent, failed } = await chat.forwardMessage(forwardMsg, targets)

      setForwardMsg(null)

      if (failed) toast.setError(`${failed} chat(s) could not receive the message`)
      else toast.setInfo(`Forwarded to ${sent} chat${sent > 1 ? 's' : ''}`)
    } catch (err) {
      toast.setError(err.message)
    } finally {
      setForwarding(false)
    }
  }

  const runConfirm = () => {
    confirm.onYes()
    setConfirm(null)
  }

  // Toast bottom nav aur gesture bar ke UPAR aana chahiye, warna wo
  // unke peeche chhup jata hai
  const snackbarSx = {
    bottom: {
      xs: 'calc(var(--safe-bottom) + 76px)',
      md: 'calc(var(--safe-bottom) + 24px)',
    },
  }

  return (
    // .app-shell = fixed height jo keyboard/URL bar/notch sab ghata kar
    // aati hai. Poore mobile layout ki neev yahi hai (dekho index.css)
    <div className="app-shell bg-app-bg text-app-text">
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
        onRowMenu={handleRowMenu}
        onOpenMyProfile={profile.openProfile}
        onNewGroup={() => setCreateGroupOpen(true)}
        hidden={!!selectedId}
        onLogout={handleLogout}
        // Mobile ka Profile tab isi se banta hai
        profile={{
          draft: profile.draft,
          setDraft: profile.setDraft,
          avatarInputRef,
          onAvatarSelect: profile.handleAvatarSelect,
          onSave: profile.saveProfile,
          saving: profile.saving,
          onDeleteAccount: profile.handleDeleteAccount,
        }}
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
        replyTo={chat.replyTo}
        onCancelReply={chat.cancelReply}
        onOpenActions={openMsgMenu}
        onOpenMedia={openMedia}
        onJumpToReply={chat.jumpToMessage}
        highlightId={chat.highlightId}
        // Group ka header dabane par Group Info, user ka header dabane par uski profile
        onOpenProfile={() =>
          selectedUser?.isGroup ? setGroupInfoOpen(true) : setViewUserId(selectedId)
        }
        onBack={() => setSelectedId(null)}
        scrollRef={chat.scrollRef}
        inputRef={chat.inputRef}
        hidden={!selectedId}
        imageInputRef={imageInputRef}
        onFileSelected={chat.handleFileSelected}
      />

      {/* ---------- MESSAGE KA ACTION SHEET ----------
          Mobile par neeche se uthta hua sheet, desktop par chhota menu -
          dono ek hi component se, isliye actions kabhi alag nahi hote */}
      <ActionSheet
        open={!!msgMenu.message}
        onClose={closeMsgMenu}
        items={messageActions}
        anchorPosition={msgMenu.point}
        ariaLabel="Message options"
      />

      {/* ---------- FULL SCREEN PHOTO/VIDEO ---------- */}
      <MediaViewer
        open={!!viewerMsgId}
        items={mediaMessages}
        startIndex={viewerIndex}
        onClose={() => setViewerMsgId(null)}
        onDownload={handleDownload}
        onShare={canShare() ? handleShare : null}
        onForward={(msg) => {
          setViewerMsgId(null)
          setForwardMsg(msg)
        }}
      />

      {/* ---------- FORWARD ---------- */}
      <ForwardDialog
        open={!!forwardMsg}
        message={forwardMsg}
        targets={forwardTargets}
        onClose={() => setForwardMsg(null)}
        onForward={handleForward}
        sending={forwarding}
      />

      <Dialogs
        me={me}
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
        sx={snackbarSx}
      >
        <Alert severity="error" onClose={() => toast.setError('')}>{toast.error}</Alert>
      </Snackbar>

      {/* Success message - hara */}
      <Snackbar
        open={!!toast.info}
        autoHideDuration={2500}
        onClose={() => toast.setInfo('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={snackbarSx}
      >
        <Alert severity="success" onClose={() => toast.setInfo('')}>{toast.info}</Alert>
      </Snackbar>
    </div>
  )
}

export default Chat
