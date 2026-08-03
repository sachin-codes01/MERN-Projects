import { useState } from 'react'
import { groupApi } from '@/api/groupApi.js'
import { uploadApi } from '@/api/uploadApi.js'
import { validateImageFile } from '@/utils/mediaValidation.js'

// ==========================================================
// useGroupActions - GROUP ka saara kaam
//
// Group banana, naam/photo badalna, members add/remove,
// group chhodna aur delete karna
//
// Jo kaam wapas nahi ho sakta (remove, leave, delete) uske liye
// seedha API call nahi karte - pehle confirm dialog dikhate hain.
// Isliye ye functions "confirm" object bana kar askConfirm() ko dete hain
// ==========================================================
export const useGroupActions = ({
  me,
  selectedId,
  selectedUser,
  setGroups,
  setSelectedId,
  loadGroups,
  askConfirm,
  toast,
}) => {
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [savingGroup, setSavingGroup] = useState(false)

  // Group photo abhi upload nahi hui, sirf preview hai - Save par Cloudinary jayegi
  const [draftImage, setDraftImage] = useState(null) // { file, url }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return

    const check = validateImageFile(file, 'Group photo')
    if (!check.ok) {
      toast.setError(check.error)
      return
    }

    setDraftImage({ file, url: URL.createObjectURL(file) })
  }

  const createGroup = async (name, memberIds, closeDialog, setTab) => {
    setCreatingGroup(true)
    try {
      const payload = { name, memberIds }

      // Photo chuni hai to pehle Cloudinary par bhej do
      if (draftImage) {
        const uploaded = await uploadApi.uploadFile(draftImage.file)
        payload.groupImage = uploaded.mediaUrl
        payload.groupImageId = uploaded.mediaPublicId
      }

      const data = await groupApi.create(payload)

      setGroups((prev) => [...prev, data.group])
      setDraftImage(null)
      closeDialog()
      setTab('chats')
      setSelectedId(data.group._id)
      toast.setInfo('Group created')
    } catch (err) {
      toast.setError(err.message)
    } finally {
      setCreatingGroup(false)
    }
  }

  // Naam ya photo badalna - sirf admin (backend par bhi check hai)
  const renameGroup = async (newName) => {
    if (!selectedUser?.isGroup) return

    setSavingGroup(true)
    try {
      const changes = { name: newName }

      if (draftImage) {
        const uploaded = await uploadApi.uploadFile(draftImage.file)
        changes.groupImage = uploaded.mediaUrl
        changes.groupImageId = uploaded.mediaPublicId
      }

      const data = await groupApi.update(selectedId, changes)

      setGroups((prev) => prev.map((g) => (g._id === selectedId ? data.group : g)))
      setDraftImage(null)
      toast.setInfo('Group updated')
    } catch (err) {
      toast.setError(err.message)
    } finally {
      setSavingGroup(false)
    }
  }

  const addMembers = async (memberIds, done) => {
    setSavingGroup(true)
    try {
      const data = await groupApi.addMembers(selectedId, memberIds)

      setGroups((prev) => prev.map((g) => (g._id === selectedId ? data.group : g)))
      done()
      toast.setInfo('Members added')
    } catch (err) {
      toast.setError(err.message)
    } finally {
      setSavingGroup(false)
    }
  }

  const removeMember = (member) => {
    askConfirm({
      title: `Remove ${member.name}?`,
      text: 'They will no longer see this group or receive its messages.',
      confirmLabel: 'Remove',
      onYes: async () => {
        try {
          await groupApi.removeMember(selectedId, member._id)
          await loadGroups()
          toast.setInfo('Member removed')
        } catch (err) {
          toast.setError(err.message)
        }
      },
    })
  }

  const leaveGroup = (onClose) => {
    const g = selectedUser
    onClose()

    askConfirm({
      title: `Leave "${g.name}"?`,
      text: 'You will stop receiving messages from this group.',
      confirmLabel: 'Leave',
      onYes: async () => {
        try {
          await groupApi.removeMember(g._id, me._id)
          setGroups((prev) => prev.filter((x) => x._id !== g._id))
          setSelectedId(null)
          toast.setInfo('You left the group')
        } catch (err) {
          toast.setError(err.message)
        }
      },
    })
  }

  const deleteGroup = (onClose) => {
    const g = selectedUser
    onClose()

    askConfirm({
      title: `Delete "${g.name}"?`,
      text: 'The group and all its messages will be deleted for everyone. This cannot be undone.',
      confirmLabel: 'Delete group',
      onYes: async () => {
        try {
          await groupApi.remove(g._id)
          setGroups((prev) => prev.filter((x) => x._id !== g._id))
          setSelectedId(null)
          toast.setInfo('Group deleted')
        } catch (err) {
          toast.setError(err.message)
        }
      },
    })
  }

  return {
    creatingGroup, savingGroup,
    draftImage, setDraftImage, handleImageSelect,
    createGroup, renameGroup, addMembers, removeMember, leaveGroup, deleteGroup,
  }
}
