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
export const useProfileActions = ({
  me, updateProfile, sendDeleteOtp, deleteAccount, askConfirm, toast, onDeleted,
}) => {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({ name: '', image: '' })

  // Delete ka code wala step: null = band, warna { sending, error }
  const [deleteStep, setDeleteStep] = useState(null)

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

  // Confirm dabane ke baad account TURANT nahi mitta - pehle email par
  // 6-digit code jata hai. Ye kaam wapas nahi ho sakta, isliye sirf
  // "logged in ho" itna kaafi nahi maana. Khula hua device kisi ke haath
  // lag jaye to bhi bina inbox ke account nahi mitega
  const requestDeleteCode = async () => {
    setDeleteStep({ sending: true, error: '' })

    try {
      await sendDeleteOtp()
      setDeleteStep({ sending: false, error: '' })
    } catch (err) {
      setDeleteStep(null)
      toast.setError(err.message)
    }
  }

  const handleDeleteAccount = () => {
    setOpen(false)

    askConfirm({
      title: 'Delete your account?',
      text: 'Your profile and chat list will be removed and nobody will be able to find you in search. People you talked to will still see the messages you sent them. This cannot be undone. We will email a 6-digit code to confirm it is really you.',
      confirmLabel: 'Send code',
      onYes: requestDeleteCode,
    })
  }

  // Code wale dabbe ka "Delete account" button
  const confirmDeleteWithCode = async (code) => {
    setDeleteStep((prev) => ({ ...prev, sending: true, error: '' }))

    try {
      await deleteAccount(code)
      setDeleteStep(null)
      onDeleted()
    } catch (err) {
      // Error dabbe ke andar hi dikhate hain - user ko code dobara
      // type karne ka mauka milta hai, dabba band nahi hota
      setDeleteStep({ sending: false, error: err.message })
    }
  }

  const cancelDelete = () => setDeleteStep(null)

  return {
    open, setOpen, openProfile,
    draft, setDraft, handleAvatarSelect,
    saving, saveProfile, handleDeleteAccount,
    deleteStep, confirmDeleteWithCode, cancelDelete, resendDeleteCode: requestDeleteCode,
  }
}
