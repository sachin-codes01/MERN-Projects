import {
  Avatar, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import PushPinIcon from '@mui/icons-material/PushPin'
import ArchiveIcon from '@mui/icons-material/Archive'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import BlockIcon from '@mui/icons-material/Block'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import GroupsIcon from '@mui/icons-material/Groups'
import { lastSeenText } from '../../utils/format.js'
import { useBackGuard } from '../../hooks/useBackGuard.js'
import { useIsMobile } from '../../hooks/useIsMobile.js'
import ActionSheet from './ActionSheet.jsx'
import ProfilePanel from './ProfilePanel.jsx'

// ==========================================================
// DIALOGS
// Saare popups ek jagah - inhe alag file me isliye rakha kyunki
// ye sirf UI hain aur inke bina Chat.jsx bahut lamba ho jata tha
//
// Message ka apna action sheet yahan NAHI hai - wo Chat.jsx me hai,
// kyunki uski list message ke type par depend karti hai
// ==========================================================
const Dialogs = ({
  me,
  // chat list ka long-press menu
  listMenu, onCloseListMenu, onToggleRelation, onOpenGroupInfo,
  // dusre user ki profile
  viewUser, onCloseViewUser, onBlockToggle, onUnsendAll,
  // meri profile (desktop ka dialog - mobile par ye bottom nav ka tab hai)
  profileOpen, onCloseProfile, draftProfile, setDraftProfile,
  avatarInputRef, onAvatarSelect, onSaveProfile, savingProfile,
  onLogout, onDeleteAccount,
  // confirm box
  confirm, onCancelConfirm, onRunConfirm,
}) => {
  const menuUser = listMenu?.user
  const isMobile = useIsMobile()

  // Android ka back in dialogs ko band karta hai, website ko nahi
  useBackGuard(!!viewUser, onCloseViewUser)
  useBackGuard(profileOpen, onCloseProfile)
  useBackGuard(!!confirm, onCancelConfirm)

  // Mobile par dialog poori screen leta hai aur notch/gesture bar ka
  // khyaal rakhta hai. Chhote dialog me keyboard khulte hi content
  // chhup jata tha
  const mobileDialogProps = isMobile
    ? {
        fullScreen: true,
        slotProps: {
          paper: { sx: { pt: 'var(--safe-top)', pb: 'var(--safe-bottom)' } },
        },
      }
    : {}

  // ---- Chat list ke long press wale actions ----
  // Group par pin/block/hide ka matlab nahi - uske liye Group Info hai
  const listActions = menuUser?.isGroup
    ? [
        {
          key: 'info',
          label: 'Group info',
          icon: <GroupsIcon fontSize="small" />,
          onClick: onOpenGroupInfo,
        },
      ]
    : [
        {
          key: 'pin',
          label: menuUser?.isPinned ? 'Unpin' : 'Pin to top',
          icon: <PushPinIcon fontSize="small" />,
          onClick: () => onToggleRelation('pinned', !menuUser?.isPinned),
        },
        {
          key: 'archive',
          label: menuUser?.isArchived ? 'Unarchive' : 'Archive chat',
          icon: menuUser?.isArchived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />,
          onClick: () => onToggleRelation('archived', !menuUser?.isArchived),
        },
        {
          key: 'block',
          label: menuUser?.isBlocked ? 'Unblock' : 'Block',
          icon: menuUser?.isBlocked ? <LockOpenIcon fontSize="small" /> : <BlockIcon fontSize="small" />,
          onClick: () => onToggleRelation('blocked', !menuUser?.isBlocked),
        },
        { key: 'divider', divider: true },
        {
          // Ye sirf list se hatata hai - messages database me rehte hain.
          // Wo dobara message bhejein to banda apne aap wapas list me aa jata hai
          key: 'hide',
          label: 'Remove from list',
          subtitle: 'Messages are kept',
          icon: <PersonRemoveIcon fontSize="small" />,
          danger: true,
          onClick: () => onToggleRelation('hidden', true),
        },
      ]

  return (
    <>
      {/* ================= CHAT LIST LONG-PRESS MENU ================= */}
      <ActionSheet
        open={!!listMenu}
        onClose={onCloseListMenu}
        items={listActions}
        anchorPosition={listMenu?.point}
        title={menuUser?.name}
        ariaLabel="Chat options"
      />

      {/* ================= DUSRE USER KI PROFILE ================= */}
      <Dialog open={!!viewUser} onClose={onCloseViewUser} fullWidth maxWidth="xs" {...mobileDialogProps}>
        <DialogContent>
          <div className="flex flex-col items-center gap-2 py-4">
            <Avatar
              src={viewUser?.profileImage}
              sx={{ width: 96, height: 96, bgcolor: '#7c3aed', fontSize: 36 }}
            >
              {viewUser?.name[0]}
            </Avatar>

            <h3 className="text-lg font-semibold mt-2 text-center">{viewUser?.name}</h3>
            {!viewUser?.isDeleted && (
              <p className="text-sm text-app-muted break-all text-center">{viewUser?.email}</p>
            )}

            <p className={`text-sm mt-1 ${viewUser?.isOnline ? 'text-green-400' : 'text-app-muted'}`}>
              {viewUser?.isDeleted
                ? 'Account deleted'
                : viewUser?.isBlocked
                ? 'You blocked this user'
                : viewUser?.isOnline
                ? 'Online'
                : lastSeenText(viewUser?.lastSeen)}
            </p>

            {viewUser && !viewUser.isDeleted && (
              <p className="text-xs text-app-muted mt-2">
                Joined {new Date(viewUser.createdAt).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>

          {viewUser && !viewUser.isDeleted && (
            <div className="flex flex-col gap-2 pb-2">
              <Button
                fullWidth
                variant="outlined"
                color={viewUser.isBlocked ? 'success' : 'error'}
                startIcon={viewUser.isBlocked ? <LockOpenIcon /> : <BlockIcon />}
                onClick={onBlockToggle}
                sx={{ minHeight: 44 }}
              >
                {viewUser.isBlocked ? 'Unblock user' : 'Block user'}
              </Button>

              {/* Sirf MERE bheje hue messages hatate hain, uske nahi */}
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={onUnsendAll}
                sx={{ minHeight: 44 }}
              >
                Unsend all my messages
              </Button>
            </div>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onCloseViewUser} sx={{ minHeight: 44 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ================= MERI PROFILE (desktop) ================= */}
      <Dialog open={profileOpen} onClose={onCloseProfile} fullWidth maxWidth="xs" {...mobileDialogProps}>
        <DialogTitle>My Profile</DialogTitle>

        <DialogContent>
          <ProfilePanel
            me={me}
            draft={draftProfile}
            setDraft={setDraftProfile}
            avatarInputRef={avatarInputRef}
            onAvatarSelect={onAvatarSelect}
            onSave={onSaveProfile}
            saving={savingProfile}
            onLogout={onLogout}
            onDeleteAccount={onDeleteAccount}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={onCloseProfile} sx={{ minHeight: 44 }}>Cancel</Button>
          <Button variant="contained" onClick={onSaveProfile} disabled={savingProfile} sx={{ minHeight: 44 }}>
            {savingProfile ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= CONFIRM DIALOG ================= */}
      {/* Delete jaisa kaam wapas nahi hota, isliye pehle confirm karte hain */}
      <Dialog open={!!confirm} onClose={onCancelConfirm}>
        <DialogTitle>{confirm?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirm?.text}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancelConfirm} sx={{ minHeight: 44 }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={onRunConfirm} sx={{ minHeight: 44 }}>
            {confirm?.confirmLabel || 'Yes, continue'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Dialogs
