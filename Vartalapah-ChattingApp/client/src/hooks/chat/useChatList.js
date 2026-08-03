import { useState, useEffect, useMemo, useCallback } from 'react'
import { groupApi } from '@/api/groupApi.js'
import { messageApi } from '@/api/messageApi.js'
import { userApi } from '@/api/userApi.js'
import { SEARCH_DEBOUNCE_MS } from '@/constants/chat.js'

// ==========================================================
// useChatList - SIDEBAR ka poora dimaag
//
// Ye hook teen jagah se data laata hai aur unhe milakar ek list banata hai:
//   1. /users              -> saare registered log
//   2. /messages/conversations -> kisse baat hui, last message, unread count
//   3. /groups             -> mere saare groups
//
// Phir tab (Chats / Requests / All people) aur search ke hisaab se
// list chhaanta hai, aur har tab ka chhota badge number bhi ginta hai
//
// Custom hook matlab: ek normal function jiska naam "use" se shuru hota hai
// aur jo andar React ke hooks (useState/useEffect) use karta hai.
// Fayda: ye saara code chat page se bahar nikal jata hai
// ==========================================================
export const useChatList = ({ me, onlineUsers, tab, search, allPeopleSeenAt, toast }) => {
  const [users, setUsers] = useState([])                 // saare registered users
  const [groups, setGroups] = useState([])               // mere saare groups
  const [conversations, setConversations] = useState({}) // { userId: { lastMessage, unreadCount, ... } }
  const [loadingUsers, setLoadingUsers] = useState(true)

  // ---------------- DATA LOADING ----------------

  const loadUsers = async (searchText = '') => {
    const data = await userApi.list(searchText)
    setUsers(data.users)
  }

  // Socket listeners ko bhi list refresh karni padti hai
  //
  // useCallback isliye lagaya hai taki ye function har render par NAYA na bane.
  // useChatSocket ise apne useEffect ki dependency me rakhta hai - naya banta
  // rehta to har render par saare socket listeners hatte aur dobara lagte
  const refreshUsers = useCallback(
    () => loadUsers(tab === 'all' ? search : '').catch(() => {}),
    [tab, search]
  )

  // Ye do fail ho jayein to app rukni nahi chahiye - inke bina bhi chat
  // khulti hai, bas sidebar me last message / unread count nahi dikhta.
  //
  // Pehle inka catch bilkul KHALI tha. Uska matlab tha: backend band ho
  // ya request fail ho jaye to sidebar chupchaap khali dikhta rehta aur
  // user samajhta ki uski saari chat gayab ho gayi. Ab kam se kam ek
  // toast dikha dete hain - app phir bhi chalti rehti hai
  const loadConversations = async () => {
    try {
      const data = await messageApi.getConversations()

      // Array ko object me badal dete hain taki userId se seedha mil jaye
      const map = {}
      data.conversations.forEach((conversation) => {
        map[conversation.userId] = conversation
      })
      setConversations(map)
    } catch (err) {
      toast.setError(`Could not load your chats: ${err.message}`)
    }
  }

  // Mere saare groups - inme last message aur unread count already aa jate hain
  const loadGroups = async () => {
    try {
      const data = await groupApi.list()
      setGroups(data.groups)
    } catch (err) {
      toast.setError(`Could not load your groups: ${err.message}`)
    }
  }

  // "All people" tab ka search server par jata hai (list badi ho sakti hai)
  // Baaki do tabs ka search neeche client par hota hai
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await loadUsers(tab === 'all' ? search : '')
      } catch (err) {
        toast.setError(err.message)
      } finally {
        setLoadingUsers(false)
      }
    }, SEARCH_DEBOUNCE_MS) // har akshar par API call na jaye

    return () => clearTimeout(timer)
  }, [search, tab])

  useEffect(() => {
    loadConversations()
    loadGroups()
  }, [])

  // ==========================================================
  // SIDEBAR KI LIST BANANA
  // users (sab log) + conversations (kisse baat hui) ko mila dete hain
  //
  // useMemo isliye: ye list har chhote se render par dobara nahi
  // banni chahiye, sirf tab jab neeche wali cheezein badlein
  // ==========================================================
  const allRows = useMemo(() => {
    const byId = {}

    // Pehle saare registered users
    users.forEach((u) => { byId[u._id] = { ...u } })

    // Phir conversation ka data unpar chipka dete hain
    Object.values(conversations).forEach((c) => {
      // Deleted account sirf conversations me milta hai (users list me nahi hota)
      const base = byId[c.userId] || c.user
      if (!base) return

      byId[c.userId] = {
        ...base,
        lastMessage: c.lastMessage,
        unreadCount: c.unreadCount,
        iReplied: c.iReplied,
        theyMessaged: c.theyMessaged,
      }
    })

    // Online status socket se live aata hai, database se nahi
    const userRows = Object.values(byId).map((u) => ({
      ...u,
      isOnline: u.canMessage && onlineUsers.has(u._id),
    }))

    // Groups ko bhi usi list me daal dete hain
    // Group me "iReplied" ka matlab: maine group me kabhi message bheja hai
    const groupRows = groups.map((g) => ({
      ...g,
      isGroup: true,
      iReplied: true, // group hamesha "Chats" tab me dikhega
      theyMessaged: false,
    }))

    return [...userRows, ...groupRows]
  }, [users, groups, conversations, onlineUsers])

  // Tab + search ke hisaab se list chhaanti hai
  const filterRows = (rows) => {
    let list = rows

    // Tab ka filter
    if (tab === 'chats') {
      // Jinse maine baat ki hai + saare groups
      // inChatList database me pakka save hai - saare messages unsend kar do
      // tab bhi banda list me bana rehta hai (sirf "Remove from list" se hatta hai)
      list = list.filter((u) => u.iReplied || u.inChatList)
    } else if (tab === 'requests') {
      // Jinhone mujhe message kiya lekin maine abhi reply nahi kiya
      list = list.filter((u) => u.theyMessaged && !u.iReplied)
    } else {
      // "All people" me sirf log dikhte hain, groups nahi
      list = list.filter((u) => !u.isGroup)
    }

    // "All" tab ka search server par ho chuka hai, baaki do ka yahan karte hain
    if (search.trim() && tab !== 'all') {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (u) => u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
      )
    }

    // Pinned sabse upar, phir jiska message sabse naya
    return [...list].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1

      const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
      const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
      if (at !== bt) return bt - at

      return a.name.localeCompare(b.name)
    })
  }

  // ==========================================================
  // GROUP ME KISE ADD KAR SAKTE HAIN
  // Sirf "Chats" aur "Requests" wale log - yaani jinse pehle se baat hui hai
  // Kisi anjaan aadmi ko group me nahi ghusa sakte
  // (Yahi rule backend par bhi lagu hai - frontend par bharosa nahi karte)
  // ==========================================================
  const addablePeople = allRows.filter(
    (u) =>
      !u.isGroup &&
      !u.isDeleted &&
      u.canMessage &&
      (u.iReplied || u.theyMessaged) // koi na koi message hua ho
  )

  // Hidden log kahin nahi dikhte, archived alag section me
  const visibleRows = filterRows(allRows.filter((u) => !u.isHidden && !u.isArchived))
  const archivedRows = filterRows(allRows.filter((u) => !u.isHidden && u.isArchived))

  // ==========================================================
  // TAB BADGES - har tab par chhota number
  // ==========================================================
  const tabCounts = useMemo(() => {
    const rows = allRows.filter((u) => !u.isHidden)

    return {
      // Kitni chats me unread messages hain
      chats: rows.filter((u) => u.iReplied && (u.unreadCount || 0) > 0).length,

      // Kitne logon ne message kiya jinka maine reply nahi kiya aur padha bhi nahi
      requests: rows.filter(
        (u) => !u.isGroup && u.theyMessaged && !u.iReplied && (u.unreadCount || 0) > 0
      ).length,

      // Aakhri baar tab kholne ke baad kitne naye users join hue
      all: rows.filter(
        (u) => !u.isGroup && new Date(u.createdAt).getTime() > allPeopleSeenAt
      ).length,
    }
  }, [allRows, allPeopleSeenAt])

  return {
    // raw data (socket listeners ise seedha update karte hain)
    groups, setGroups,
    conversations, setConversations,
    loadingUsers,

    // loading functions
    loadUsers, refreshUsers, loadConversations, loadGroups,

    // banayi hui lists
    allRows, visibleRows, archivedRows, addablePeople, tabCounts,
  }
}
