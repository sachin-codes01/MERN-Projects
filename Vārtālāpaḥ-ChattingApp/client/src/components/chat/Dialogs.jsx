import {
  Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, TextField, Badge, Menu, MenuItem, ListItemIcon, Divider,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import PushPinIcon from '@mui/icons-material/PushPin'
import ArchiveIcon from '@mui/icons-material/Archive'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import BlockIcon from '@mui/icons-material/Block'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import LogoutIcon from '@mui/icons-material/Logout'
import GroupsIcon from '@mui/icons-material/Groups'
import { lastSeenText, senderIdOf } from '../../utils/format.js'
import { useThemeMode } from '../../context/ThemeContext.jsx'

// ==========================================================
// DIALOGS
// Saare popups aur menus ek jagah
// Inhe alag file me isliye rakha kyunki ye sirf UI hain,
// aur inke bina index.jsx bahut lamba ho jata tha
// ==========================================================
const Dialogs = ({
  me,
  // message ka 3-dot menu
  msgMenu, onCloseMsgMenu, onCopy, onStartEdit, onUnsend,
  // chat list ka long-press menu
  listMenu, onCloseListMenu, onToggleRelation, onOpenGroupInfo,
  // dusre user ki profile
  viewUser, onCloseViewUser, onBlockToggle, onUnsendAll,
  // meri profile
  profileOpen, onCloseProfile, draftProfile, setDraftProfile,
  avatarInputRef, onAvatarSelect, onSaveProfile, savingProfile,
  onLogout, onDeleteAccount,
  // confirm box
  confirm, onCancelConfirm, onRunConfirm,
}) => {
  const menuUser = listMenu?.user
  const { mode, setMode } = useThemeMode()

  return (
    <>
      {/* ================= MESSAGE 3-DOT MENU ================= */}
      <Menu anchorEl={msgMenu.anchor} open={!!msgMenu.anchor} onClose={onCloseMsgMenu}>
        {msgMenu.message?.messageType === 'text' && (
          <MenuItem onClick={onCopy}>
            <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
            Copy
          </MenuItem>
        )}

        {/* Edit aur Unsend sirf apne message par dikhte hain
            (backend par bhi yahi check hai - frontend par bharosa nahi karte) */}
        {msgMenu.message && senderIdOf(msgMenu.message) === me._id && msgMenu.message?.messageType === 'text' && (
          <MenuItem onClick={onStartEdit}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            Edit
          </MenuItem>
        )}

        {msgMenu.message && senderIdOf(msgMenu.message) === me._id && (
          <MenuItem onClick={onUnsend} sx={{ color: '#f87171' }}>
            <ListItemIcon><DeleteOutlineIcon fontSize="small" sx={{ color: '#f87171' }} /></ListItemIcon>
            Unsend
          </MenuItem>
        )}
      </Menu>

      {/* ================= CHAT LIST LONG-PRESS MENU ================= */}
      <Menu
        open={!!listMenu}
        onClose={onCloseListMenu}
        anchorReference="anchorPosition"
        anchorPosition={listMenu ? { top: listMenu.y, left: listMenu.x } : undefined}
      >
        {/* MUI ka Menu <>...</> (Fragment) accept nahi karta - console me error deta hai
            Isliye conditional items ko ARRAY me return karte hain
            Array me har item par key dena zaroori hai */}
        {menuUser?.isGroup
          ? [
              // Group par pin/block/hide ka matlab nahi - uske liye Group Info hai
              <MenuItem key="info" onClick={onOpenGroupInfo}>
                <ListItemIcon><GroupsIcon fontSize="small" /></ListItemIcon>
                Group info
              </MenuItem>,
            ]
          : [
              <MenuItem key="pin" onClick={() => onToggleRelation('pinned', !menuUser?.isPinned)}>
                <ListItemIcon><PushPinIcon fontSize="small" /></ListItemIcon>
                {menuUser?.isPinned ? 'Unpin' : 'Pin to top'}
              </MenuItem>,

              <MenuItem key="archive" onClick={() => onToggleRelation('archived', !menuUser?.isArchived)}>
                <ListItemIcon>
                  {menuUser?.isArchived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
                </ListItemIcon>
                {menuUser?.isArchived ? 'Unarchive' : 'Archive chat'}
              </MenuItem>,

              <MenuItem key="block" onClick={() => onToggleRelation('blocked', !menuUser?.isBlocked)}>
                <ListItemIcon>
                  {menuUser?.isBlocked ? <LockOpenIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                </ListItemIcon>
                {menuUser?.isBlocked ? 'Unblock' : 'Block'}
              </MenuItem>,

              <Divider key="divider" />,

              // Ye sirf list se hatata hai - messages database me rehte hain
              // Wo dobara message bhejein to person apne aap wapas list me aa jata hai
              <MenuItem key="hide" onClick={() => onToggleRelation('hidden', true)} sx={{ color: '#f87171' }}>
                <ListItemIcon><PersonRemoveIcon fontSize="small" sx={{ color: '#f87171' }} /></ListItemIcon>
                Remove from list
              </MenuItem>,
            ]}
      </Menu>

      {/* ================= DUSRE USER KI PROFILE ================= */}
      <Dialog open={!!viewUser} onClose={onCloseViewUser} fullWidth maxWidth="xs">
        <DialogContent>
          <div className="flex flex-col items-center gap-2 py-4">
            <Avatar
              src={viewUser?.profileImage}
              sx={{ width: 96, height: 96, bgcolor: '#7c3aed', fontSize: 36 }}
            >
              {viewUser?.name[0]}
            </Avatar>

            <h3 className="text-lg font-semibold mt-2">{viewUser?.name}</h3>
            {!viewUser?.isDeleted && <p className="text-sm text-app-muted">{viewUser?.email}</p>}

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

          {/* ---------- ACTIONS ---------- */}
          {viewUser && !viewUser.isDeleted && (
            <div className="flex flex-col gap-2 pb-2">
              <Button
                fullWidth
                variant="outlined"
                color={viewUser.isBlocked ? 'success' : 'error'}
                startIcon={viewUser.isBlocked ? <LockOpenIcon /> : <BlockIcon />}
                onClick={onBlockToggle}
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
              >
                Unsend all my messages
              </Button>
            </div>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onCloseViewUser}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ================= MERI PROFILE ================= */}
      <Dialog open={profileOpen} onClose={onCloseProfile} fullWidth maxWidth="xs">
        <DialogTitle>My Profile</DialogTitle>

        <DialogContent>
          <div className="flex flex-col items-center gap-4 pt-2">
            {/* Hidden input - camera icon dabane par khulta hai */}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={avatarInputRef}
              onChange={onAvatarSelect}
              className="hidden"
            />

            {/* Badge se avatar ke corner par chhota camera button lagaya hai */}
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <IconButton
                  size="small"
                  title="Change photo"
                  onClick={() => avatarInputRef.current.click()}
                  sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
                >
                  <PhotoCameraIcon sx={{ fontSize: 16, color: 'white' }} />
                </IconButton>
              }
            >
              <Avatar
                src={draftProfile.image}
                sx={{ width: 96, height: 96, bgcolor: '#a855f7', fontSize: 36 }}
              >
                {draftProfile.name[0]}
              </Avatar>
            </Badge>

            <TextField
              label="Name"
              fullWidth
              size="small"
              value={draftProfile.name}
              onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })}
            />

            {/* Email Google se aata hai, isliye badla nahi ja sakta */}
            <TextField label="Email" fullWidth size="small" value={me.email} disabled />

            {/* Light/Dark mode - localStorage me save hota hai (ThemeContext.jsx) */}
            <div className="w-full flex items-center justify-between gap-3">
              <span className="text-sm text-app-muted">Appearance</span>
              <ToggleButtonGroup
                size="small"
                value={mode}
                exclusive
                onChange={(e, value) => value && setMode(value)}
              >
                <ToggleButton value="light" sx={{ gap: 0.5, px: 1.5 }}>
                  <LightModeIcon sx={{ fontSize: 16 }} /> Light
                </ToggleButton>
                <ToggleButton value="dark" sx={{ gap: 0.5, px: 1.5 }}>
                  <DarkModeIcon sx={{ fontSize: 16 }} /> Dark
                </ToggleButton>
              </ToggleButtonGroup>
            </div>

            <Divider flexItem sx={{ borderColor: '#334155', my: 1 }} />

            <Button fullWidth variant="outlined" startIcon={<LogoutIcon />} onClick={onLogout}>
              Log out
            </Button>

            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={onDeleteAccount}
            >
              Delete my account
            </Button>
          </div>
        </DialogContent>

        <DialogActions>
          <Button onClick={onCloseProfile}>Cancel</Button>
          <Button variant="contained" onClick={onSaveProfile} disabled={savingProfile}>
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
          <Button onClick={onCancelConfirm}>Cancel</Button>
          <Button color="error" variant="contained" onClick={onRunConfirm}>
            {confirm?.confirmLabel || 'Yes, continue'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Dialogs
