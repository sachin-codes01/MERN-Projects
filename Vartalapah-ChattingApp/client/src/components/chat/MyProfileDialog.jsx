import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import ProfilePanel from './ProfilePanel.jsx'
import { useBackGuard } from '@/hooks/ui/useBackGuard.js'
import { useIsMobile } from '@/hooks/ui/useMediaQuery.js'

// ==========================================================
// MY PROFILE DIALOG (desktop)
//
// Mobile par profile bottom nav ka ek poora tab hai, dialog nahi.
// Dono jagah ka andar ka content EK hi component se aata hai
// (ProfilePanel), isliye wo kabhi alag nahi ho sakte - sirf uske
// bahar ka dabba alag hai
// ==========================================================
const MyProfileDialog = ({
  open,
  onClose,
  me,
  draft,
  setDraft,
  avatarInputRef,
  onAvatarSelect,
  onSave,
  saving,
  onLogout,
  onDeleteAccount,
}) => {
  const isMobile = useIsMobile()

  useBackGuard(open, onClose)

  const mobileProps = isMobile
    ? {
        fullScreen: true,
        slotProps: { paper: { sx: { pt: 'var(--safe-top)', pb: 'var(--safe-bottom)' } } },
      }
    : {}

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" {...mobileProps}>
      <DialogTitle>My Profile</DialogTitle>

      <DialogContent>
        <ProfilePanel
          me={me}
          draft={draft}
          setDraft={setDraft}
          avatarInputRef={avatarInputRef}
          onAvatarSelect={onAvatarSelect}
          onSave={onSave}
          saving={saving}
          onLogout={onLogout}
          onDeleteAccount={onDeleteAccount}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ minHeight: 44 }}>Cancel</Button>
        <Button variant="contained" onClick={onSave} disabled={saving} sx={{ minHeight: 44 }}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MyProfileDialog
