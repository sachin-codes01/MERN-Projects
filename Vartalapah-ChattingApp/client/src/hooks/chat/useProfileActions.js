import { useState } from 'react'
import { uploadApi } from '@/api/uploadApi.js'
import { validateImageFile } from '@/utils/mediaValidation.js'

// ==========================================================
// useProfileActions - APNI PROFILE ka kaam
//
// Naam/photo badalna aur account delete karna
//
// Photo turant upload nahi hoti - pehle sirf preview dikhta hai
// aur Save dabane par hi Cloudinary par jati hai. Isse user
// photo badal kar Cancel kar de to bekaar upload nahi hoti
// ==========================================================
export const useProfileActions = ({ me, updateProfile, deleteAccount, askConfirm, toast, onDeleted }) => {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({ name: '', image: '' })

  const openProfile = () => {
    setDraft({ name: me.name, image: me.profileImage || '' })
    setOpen(true)
  }

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return

    const check = validateImageFile(file, 'Profile photo')
    if (!check.ok) {
      toast.setError(check.error)
      return
    }

    setDraft((prev) => ({ ...prev, image: URL.createObjectURL(file), file }))
    toast.setInfo('Photo preview set. It will upload when you press Save.')
  }

  const saveProfile = async () => {
    const name = draft.name.trim()
    if (name.length < 2) {
      toast.setError('Name must be at least 2 characters')
      return
    }

    setSaving(true)
    try {
      const updates = { name }

      // Nayi photo chuni hai to pehle Cloudinary par bhej do
      if (draft.file) {
        const uploaded = await uploadApi.uploadFile(draft.file)
        updates.profileImage = uploaded.mediaUrl
      }

      await updateProfile(updates)
      setOpen(false)
      toast.setInfo('Profile updated')
    } catch (err) {
      toast.setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    setOpen(false)

    askConfirm({
      title: 'Delete your account?',
      text: 'Your profile and chat list will be removed and nobody will be able to find you in search. People you talked to will still see the messages you sent them. This cannot be undone.',
      confirmLabel: 'Delete account',
      onYes: async () => {
        try {
          await deleteAccount()
          onDeleted()
        } catch (err) {
          toast.setError(err.message)
        }
      },
    })
  }

  return {
    open, setOpen, openProfile,
    draft, setDraft, handleAvatarSelect,
    saving, saveProfile, handleDeleteAccount,
  }
}
