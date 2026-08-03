import { useCallback } from 'react'
import { userApi } from '@/api/userApi.js'

// ==========================================================
// useChatRelations - "rishte" badalne wale actions
//
// Relation matlab do users ka aapas ka rishta: pin, archive, block,
// aur "list se hatana". Chaaron ke liye backend par EK hi endpoint hai
// (PUT /users/:id/relation) - body me jo key bhejo wahi badalti hai.
//
// Ye Chat.jsx se isliye nikala gaya ki wahan ye teen functions ~70
// line le rahe the aur unka page ke layout se koi lena dena nahi tha.
// Ab Chat.jsx sirf "jodne wali" file rah gayi hai
// ==========================================================

// Har relation badalne par user ko kya dikhana hai
const SUCCESS_LABELS = {
  pinned: { on: 'Pinned', off: 'Unpinned' },
  archived: { on: 'Archived', off: 'Unarchived' },
  blocked: { on: 'User blocked', off: 'User unblocked' },
  hidden: { on: 'Removed from list', off: 'Restored to list' },
}

export const useChatRelations = ({
  selectedId,
  setSelectedId,
  refreshUsers,
  unsendAllTo,
  askConfirm,
  toast,
}) => {
  // ==========================================================
  // Pin / archive / block / hide - sabke liye ek hi function
  // ==========================================================
  const toggleRelation = useCallback(
    async (targetUser, key, value) => {
      if (!targetUser) return

      try {
        await userApi.updateRelation(targetUser._id, { [key]: value })
        await refreshUsers()

        // List se hata diya to uski khuli hui chat bhi band kar do -
        // warna aisi chat khuli reh jati hai jo list me hai hi nahi
        if (key === 'hidden' && value && selectedId === targetUser._id) {
          setSelectedId(null)
        }

        toast.setInfo(SUCCESS_LABELS[key][value ? 'on' : 'off'])
      } catch (err) {
        toast.setError(err.message)
      }
    },
    [selectedId, setSelectedId, refreshUsers, toast]
  )

  // View-profile dialog se block/unblock
  const toggleBlock = useCallback(
    (user) => toggleRelation(user, 'blocked', !user?.isBlocked),
    [toggleRelation]
  )

  // ==========================================================
  // "Mere saare messages unsend karo"
  //
  // Ye wapas nahi ho sakta, isliye pehle confirm. Dhyan do: sirf MERE
  // bheje hue messages hatate hain - uske bheje hue uske hain
  // ==========================================================
  const unsendAllMessages = useCallback(
    (user, onDone) => {
      if (!user) return

      askConfirm({
        title: `Unsend all messages to ${user.name}?`,
        text: 'Every message you sent to this person will be removed for both of you. Their messages will stay. This cannot be undone.',
        confirmLabel: 'Unsend all',
        onYes: async () => {
          try {
            const count = await unsendAllTo(user._id)
            onDone()
            toast.setInfo(`${count} message(s) unsent`)
          } catch (err) {
            toast.setError(err.message)
          }
        },
      })
    },
    [unsendAllTo, askConfirm, toast]
  )

  return { toggleRelation, toggleBlock, unsendAllMessages }
}
