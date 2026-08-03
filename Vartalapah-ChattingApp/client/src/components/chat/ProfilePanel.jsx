import {
  Avatar, IconButton, Badge, TextField, Button, Divider,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import { useThemeMode } from '../../context/ThemeContext.jsx'
import { dividerSx } from './muiStyles.js'

// ==========================================================
// PROFILE PANEL
//
// Ye wahi purana "My Profile" wala content hai, bas ab ek alag
// component me. Zarurat isliye padi ki ab ye DO jagah dikhta hai:
//
//   Mobile  -> bottom nav ka "Profile" tab (poori screen)
//   Desktop -> pehle jaisa dialog
//
// Do jagah copy-paste karne se ek jagah ka change dusri jagah rehna
// bhool jata hai. Ek component rakhne se dono hamesha ek jaise rehte hain
// ==========================================================
const ProfilePanel = ({
  me,
  draft,
  setDraft,
  avatarInputRef,
  onAvatarSelect,
  onSave,
  saving,
  onLogout,
  onDeleteAccount,
  // Mobile ke poore-screen wale panel me Save neeche apna button chahiye,
  // dialog me wo DialogActions me hota hai
  showSaveButton = false,
}) => {
  const { mode, setMode } = useThemeMode()

  return (
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
            aria-label="Change profile photo"
            onClick={() => avatarInputRef.current.click()}
            sx={{
              bgcolor: '#7c3aed',
              '&:hover': { bgcolor: '#6d28d9' },
              // 44px touch target - chhota badge ungli se mushkil se lagta tha
              width: 36, height: 36,
            }}
          >
            <PhotoCameraIcon sx={{ fontSize: 18, color: 'white' }} />
          </IconButton>
        }
      >
        <Avatar src={draft.image} sx={{ width: 96, height: 96, bgcolor: '#a855f7', fontSize: 36 }}>
          {draft.name[0]}
        </Avatar>
      </Badge>

      <TextField
        label="Name"
        fullWidth
        size="small"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        className="no-zoom-input"
      />

      {/* Email Google se aata hai, isliye badla nahi ja sakta */}
      <TextField label="Email" fullWidth size="small" value={me.email} disabled className="no-zoom-input" />

      {/* Light/Dark mode - localStorage me save hota hai (ThemeContext.jsx) */}
      <div className="w-full flex items-center justify-between gap-3">
        <span className="text-sm text-app-muted">Appearance</span>

        <ToggleButtonGroup
          size="small"
          value={mode}
          exclusive
          onChange={(e, value) => value && setMode(value)}
          aria-label="Appearance"
        >
          <ToggleButton value="light" sx={{ gap: 0.5, px: 1.5, minHeight: 40 }}>
            <LightModeIcon sx={{ fontSize: 16 }} /> Light
          </ToggleButton>
          <ToggleButton value="dark" sx={{ gap: 0.5, px: 1.5, minHeight: 40 }}>
            <DarkModeIcon sx={{ fontSize: 16 }} /> Dark
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      {showSaveButton && (
        <Button fullWidth variant="contained" onClick={onSave} disabled={saving} sx={{ minHeight: 44 }}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      )}

      <Divider flexItem sx={{ ...dividerSx, my: 1 }} />

      <Button
        fullWidth
        variant="outlined"
        startIcon={<LogoutIcon />}
        onClick={onLogout}
        sx={{ minHeight: 44 }}
      >
        Log out
      </Button>

      <Button
        fullWidth
        variant="outlined"
        color="error"
        startIcon={<DeleteOutlineIcon />}
        onClick={onDeleteAccount}
        sx={{ minHeight: 44 }}
      >
        Delete my account
      </Button>
    </div>
  )
}

export default ProfilePanel
