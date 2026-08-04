import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Snackbar } from '@mui/material'

import ChatListActionSheet from '@/components/chat/ChatListActionSheet.jsx'
import ChatWindow from '@/components/chat/ChatWindow.jsx'
import CreateGroupDialog from '@/components/chat/CreateGroupDialog.jsx'
import ForwardDialog from '@/components/chat/ForwardDialog.jsx'
import GroupInfoDialog from '@/components/chat/GroupInfoDialog.jsx'
import MediaViewer from '@/components/chat/MediaViewer.jsx'
import MyProfileDialog from '@/components/chat/MyProfileDialog.jsx'
import Sidebar from '@/components/chat/Sidebar.jsx'
import UserProfileDialog from '@/components/chat/UserProfileDialog.jsx'
import ActionSheet from '@/components/ui/ActionSheet.jsx'
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx'
import DeleteAccountDialog from '@/components/ui/DeleteAccountDialog.jsx'

import { useAuth } from '@/context/AuthContext.jsx'
import { useSocket } from '@/context/SocketContext.jsx'

import { useChatList } from '@/hooks/chat/useChatList.js'
import { useChatRelations } from '@/hooks/chat/useChatRelations.js'
import { useChatSocket } from '@/hooks/chat/useChatSocket.js'
import { useGroupActions } from '@/hooks/chat/useGroupActions.js'
import { useMessageActions } from '@/hooks/chat/useMessageActions.jsx'
import { useMessages } from '@/hooks/chat/useMessages.js'
import { useProfileActions } from '@/hooks/chat/useProfileActions.js'
import { useScreenshotDetect } from '@/hooks/chat/useScreenshotDetect.js'
import { useBackGuard } from '@/hooks/ui/useBackGuard.js'
import { useIsMobile } from '@/hooks/ui/useMediaQuery.js'
import { useToast } from '@/hooks/ui/useToast.js'
import { useVisualViewport } from '@/hooks/ui/useVisualViewport.js'

import { TOAST_ERROR_MS, TOAST_SUCCESS_MS } from '@/constants/chat.js'
import { STORAGE_KEYS } from '@/constants/storageKeys.js'
import { canShare } from '@/utils/mediaFile.js'

// ==========================================================
// CHAT PAGE
//
// Ye file khud kuch "karti" nahi hai - ye COMPOSITION ROOT hai, yaani
// sab kuch sirf JODTI hai. Saara kaam hooks me hai:
//
//   useChatList       -> sidebar ki list (users, groups, conversations)
//   useMessages       -> khuli hui chat (load, send, reply, edit, delete)
//   useChatSocket     -> real-time events sunna
//   useMessageActions -> long-press menu + media viewer + forward
//   useChatRelations  -> pin / archive / block / remove
//   useGroupActions   -> group banana, badalna, delete
//   useProfileActions -> apni profile aur account delete
//
//   useVisualViewport -> mobile keyboard aur safe area (layout ki jaan)
//   useBackGuard      -> Android ka back button
//   useScreenshotDetect -> "Sachin took a screenshot."
//
// Isse har cheez apni chhoti file me rehti hai. Kuch samajhna ho to
// poori 600 line padhne ki jagah sirf ek hook kholo
// ==========================================================
const Chat = () => {
  const navigate = useNavigate()

  const { user: me, logout, updateProfile, sendDeleteOtp, deleteAccount } = useAuth()
  const { socket, onlineUsers } = useSocket()

  const toast = useToast()
  const isMobile = useIsMobile()

  // ---- MOBILE LAYOUT KI JAAN ----
  // Ye hook <html> par --app-height / --app-offset-top / --safe-* set
  // karta hai aur document ka apna scroll band kar deta hai. Poore
  // keyboard aur safe-area ka ilaaj yahi ek line hai
  const keyboard = useVisualViewport()

  // ---------------- SCREEN KA STATE ----------------

  // Tab hamesha "chats" se shuru hota hai. Pehle ye localStorage me save
  // hota tha, jiski wajah se website dobara kholne par kisi bhi random
  // screen par khul jati thi. Ab shuruaat hamesha ek hi jagah se hoti hai
  const [tab, setTab] = useState('chats')
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  // Khuli hui chat bhi save nahi hoti - reopen par hamesha Chats list milti hai
  const [selectedId, setSelectedId] = useState(null)

  // "All people" tab par naye users ka badge dikhane ke liye: wo tab
  // aakhri baar kab kholi thi
  const [allPeopleSeenAt, setAllPeopleSeenAt] = useState(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEYS.allPeopleSeenAt))

    // Pehli baar app khol rahe ho to abhi ka time - warna saare purane
    // users bhi "naye" dikhenge
    if (!saved) {
      const now = Date.now()
      localStorage.setItem(STORAGE_KEYS.allPeopleSeenAt, String(now))
      return now
    }

    return saved
  })

  // ---- Dialogs ka chhota state ----
  const [viewUserId, setViewUserId] = useState(null)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false)
  const [listMenu, setListMenu] = useState(null) // { point, user }
  const [confirm, setConfirm] = useState(null)

  const imageInputRef = useRef(null)
  const avatarInputRef = useRef(null)
  const groupImageInputRef = useRef(null)

  // Socket listeners ek hi baar bante hain, isliye unhe latest selectedId
  // REF se milti hai. Warna wo pehli wali value yaad rakhte hain - isse
  // "stale closure" kehte hain
  const selectedIdRef = useRef(null)
  const selectedRef = useRef(null)

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  // ---------------- HOOKS ----------------

  const askConfirm = useCallback((options) => setConfirm(options), [])

  const list = useChatList({ onlineUsers, tab, search, allPeopleSeenAt, toast })

  const selectedUser = list.allRows.find((row) => row._id === selectedId) || null
  const viewUser = list.allRows.find((row) => row._id === viewUserId) || null

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

  // useMessages() har render par ek NAYA `chat` object deta hai, isliye
  // neeche useCallback ki dependency me poora "chat" nahi likhte - sirf
  // ye do function seedhe nikaal lete hain, jo khud stable hain
  // (cancelEdit useCallback([]) se bana hai, setTypingUserId useState ka
  // setter hai)
  const { cancelEdit, setTypingUserId } = chat

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

  const messageActions = useMessageActions({
    me,
    messages: chat.messages,
    chat,
    askConfirm,
    toast,
  })

  const relations = useChatRelations({
    selectedId,
    setSelectedId,
    refreshUsers: list.refreshUsers,
    unsendAllTo: chat.unsendAllTo,
    askConfirm,
    toast,
  })

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
    sendDeleteOtp,
    deleteAccount,
    askConfirm,
    toast,
    onDeleted: () => navigate('/'),
  })

  // useProfileActions() bhi har render par NAYA object deta hai - setDraft
  // khud useState ka setter hai, isliye stable hai
  const { setDraft } = profile

  // ==========================================================
  // ANDROID BACK BUTTON
  //
  // Maanga gaya flow:
  //     Chats -> Conversation --back--> Chats --back--> website band
  //
  // Har khuli hui cheez history me ek nakli entry daalti hai. Desktop par
  // chat aur list saath saath dikhte hain, isliye wahan chat wala guard
  // nahi lagta - warna back dabane par "kuch hua hi nahi" jaisa lagta
  // ==========================================================
  useBackGuard(isMobile && !!selectedId, () => setSelectedId(null))
  useBackGuard(isMobile && tab !== 'chats', () => setTab('chats'))

  // ==========================================================
  // SCREENSHOT
  // Browser me screenshot ka koi API nahi hai. Ye hook sirf ASLI signal
  // par chalta hai - native wrapper ka event, ya desktop ka PrintScreen /
  // Cmd+Shift+3. Poori baat useScreenshotDetect.js me likhi hai
  // ==========================================================
  useScreenshotDetect({ enabled: !!selectedId, onScreenshot: chat.notifyScreenshot })

  // "All people" tab kholte hi naye users "dekh liye" - badge hat jata hai
  useEffect(() => {
    if (tab !== 'all') return

    const now = Date.now()
    localStorage.setItem(STORAGE_KEYS.allPeopleSeenAt, String(now))
    setAllPeopleSeenAt(now)
  }, [tab])

  // Mobile ka Profile tab wahi draft use karta hai jo desktop ka dialog -
  // kholte waqt use asli value se bharna zaroori hai
  useEffect(() => {
    if (tab === 'profile') setDraft({ name: me.name, image: me.profileImage || '' })
  }, [tab, me.name, me.profileImage, setDraft])

  // ---------------- CHHOTE HANDLERS ----------------

  const openChat = useCallback(
    (row) => {
      setSelectedId(row._id)
      cancelEdit()
      setTypingUserId(null)
    },
    [cancelEdit, setTypingUserId]
  )

  const openRowMenu = useCallback((user, point) => setListMenu({ point, user }), [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const runConfirm = () => {
    confirm.onYes()
    setConfirm(null)
  }

  // Sirf unhi logon/groups ko forward kar sakte ho jinse baat ho sakti hai
  const forwardTargets = useMemo(
    () =>
      list.allRows.filter(
        (row) => row.isGroup || (!row.isDeleted && row.canMessage && !row.isHidden)
      ),
    [list.allRows]
  )

  // Toast bottom nav aur gesture bar ke UPAR aana chahiye, warna wo
  // unke peeche chhup jata hai
  const snackbarSx = {
    bottom: {
      xs: 'calc(var(--safe-bottom) + 76px)',
      md: 'calc(var(--safe-bottom) + 24px)',
    },
  }

  return (
    // .app-shell = fixed height jo keyboard, URL bar aur notch sab ghata
    // kar aati hai. Poore mobile layout ki neev yahi hai (dekho styles/index.css)
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
        onRowMenu={openRowMenu}
        onOpenMyProfile={profile.openProfile}
        onNewGroup={() => setIsCreateGroupOpen(true)}
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
        // typingUserId sirf tabhi set hota hai jab wo CURRENTLY khuli
        // chat ke liye ho - useChatSocket.js ka onTyping/onStopTyping
        // pehle hi selectedIdRef se match karke filter kar deta hai.
        // Isliye yahan seedha pass karo - selectedId se dobara compare
        // karna galat hai (private me `true` hota hai, group me sender
        // ka naam - dono kabhi selectedId (ek Mongo id) ke barabar nahi ho sakte)
        isTyping={chat.typingUserId}
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
        onOpenActions={messageActions.openMenu}
        onOpenMedia={messageActions.openViewer}
        onJumpToReply={chat.jumpToMessage}
        highlightId={chat.highlightId}
        // Group ka header dabane par Group Info, aadmi ka header dabane par uski profile
        onOpenProfile={() =>
          selectedUser?.isGroup ? setIsGroupInfoOpen(true) : setViewUserId(selectedId)
        }
        onBack={() => setSelectedId(null)}
        scrollRef={chat.scrollRef}
        inputRef={chat.inputRef}
        hidden={!selectedId}
        imageInputRef={imageInputRef}
        onFileSelected={chat.handleFileSelected}
      />

      {/* ---------- MESSAGE KA LONG-PRESS MENU ----------
          Mobile par neeche se uthta hua sheet, desktop par chhota menu -
          dono ek hi component se, isliye actions kabhi alag nahi hote */}
      <ActionSheet
        open={!!messageActions.menu.message}
        onClose={messageActions.closeMenu}
        items={messageActions.items}
        anchorPosition={messageActions.menu.point}
        ariaLabel="Message options"
      />

      {/* ---------- FULL SCREEN PHOTO / VIDEO ---------- */}
      <MediaViewer
        open={messageActions.isViewerOpen}
        items={messageActions.mediaMessages}
        startIndex={messageActions.viewerIndex}
        onClose={messageActions.closeViewer}
        onDownload={messageActions.handleDownload}
        onShare={canShare() ? messageActions.handleShare : null}
        onForward={(message) => {
          messageActions.closeViewer()
          messageActions.startForward(message)
        }}
      />

      <ForwardDialog
        open={!!messageActions.forwardMessage}
        message={messageActions.forwardMessage}
        targets={forwardTargets}
        onClose={messageActions.cancelForward}
        onForward={(targetIds) =>
          messageActions.confirmForward(
            forwardTargets.filter((target) => targetIds.includes(target._id))
          )
        }
        sending={messageActions.isForwarding}
      />

      {/* ---------- SIDEBAR ROW KA LONG-PRESS MENU ---------- */}
      <ChatListActionSheet
        listMenu={listMenu}
        onClose={() => setListMenu(null)}
        onToggleRelation={(key, value) => {
          const target = listMenu?.user
          setListMenu(null)
          relations.toggleRelation(target, key, value)
        }}
        onOpenGroupInfo={() => {
          setSelectedId(listMenu.user._id)
          setListMenu(null)
          setIsGroupInfoOpen(true)
        }}
      />

      {/* ---------- PROFILES ---------- */}
      <UserProfileDialog
        user={viewUser}
        onClose={() => setViewUserId(null)}
        onBlockToggle={() => relations.toggleBlock(viewUser)}
        onUnsendAll={() => relations.unsendAllMessages(viewUser, () => setViewUserId(null))}
      />

      <MyProfileDialog
        open={profile.open}
        onClose={() => profile.setOpen(false)}
        me={me}
        draft={profile.draft}
        setDraft={profile.setDraft}
        avatarInputRef={avatarInputRef}
        onAvatarSelect={profile.handleAvatarSelect}
        onSave={profile.saveProfile}
        saving={profile.saving}
        onLogout={handleLogout}
        onDeleteAccount={profile.handleDeleteAccount}
      />

      {/* ---------- GROUPS ---------- */}
      <CreateGroupDialog
        open={isCreateGroupOpen}
        onClose={() => {
          setIsCreateGroupOpen(false)
          group.setDraftImage(null)
        }}
        // Group me sirf un logon ko add kar sakte ho jinse pehle baat hui hai
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
        open={isGroupInfoOpen}
        group={selectedUser?.isGroup ? selectedUser : null}
        me={me}
        people={list.addablePeople}
        onClose={() => {
          setIsGroupInfoOpen(false)
          group.setDraftImage(null)
        }}
        onRename={group.renameGroup}
        onRemoveMember={group.removeMember}
        onAddMembers={group.addMembers}
        onLeave={() => group.leaveGroup(() => setIsGroupInfoOpen(false))}
        onDelete={() => group.deleteGroup(() => setIsGroupInfoOpen(false))}
        groupImageInputRef={groupImageInputRef}
        onGroupImageSelect={group.handleImageSelect}
        draftImage={group.draftImage?.url}
        saving={group.savingGroup}
      />

      {/* Delete/unsend jaisa har kaam isi ek dialog se confirm hota hai */}
      <ConfirmDialog
        confirm={confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />

      {/* Account delete: confirm ke baad email wala code yahan bharta hai */}
      <DeleteAccountDialog
        step={profile.deleteStep}
        email={me.email}
        onConfirm={profile.confirmDeleteWithCode}
        onResend={profile.resendDeleteCode}
        onCancel={profile.cancelDelete}
      />

      {/* ---------- TOASTS ---------- */}
      <Snackbar
        open={!!toast.error}
        autoHideDuration={TOAST_ERROR_MS}
        onClose={() => toast.setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={snackbarSx}
      >
        <Alert severity="error" onClose={() => toast.setError('')}>
          {toast.error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!toast.info}
        autoHideDuration={TOAST_SUCCESS_MS}
        onClose={() => toast.setInfo('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={snackbarSx}
      >
        <Alert severity="success" onClose={() => toast.setInfo('')}>
          {toast.info}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default Chat
