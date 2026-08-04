import {
  Avatar, IconButton, Badge, TextField, Button,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import { useThemeMode } from '@/context/ThemeContext.jsx'
import { IMAGE_ACCEPT } from '@/constants/media.js'
import { BRAND } from '@/constants/theme.js'

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
//
// Design: teen chhote "card" section (photo+naam, appearance, danger
// zone) - flat stacked list ke bajaye, taaki har group visually alag dikhe
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
    <div className="flex flex-col gap-4 pt-2">
      {/* Hidden input - camera icon dabane par khulta hai */}
      <input
        type="file"
        accept={IMAGE_ACCEPT}
        ref={avatarInputRef}
        onChange={onAvatarSelect}
        className="hidden"
      />

      {/* ---------- CARD 1: PHOTO + NAAM ---------- */}
      <div className="flex flex-col items-center gap-4 bg-app-bg rounded-2xl px-5 py-6 border border-app-border">
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
                bgcolor: BRAND.dark,
                '&:hover': { bgcolor: BRAND.hover },
                border: '2px solid var(--color-app-bg)',
                // 44px touch target - chhota badge ungli se mushkil se lagta tha
                width: 36, height: 36,
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: 18, color: 'white' }} />
            </IconButton>
          }
        >
          <Avatar
            src={draft.image}
            sx={{
              width: 104, height: 104, bgcolor: BRAND.light, fontSize: 38,
              border: '3px solid var(--color-app-panel)',
              boxShadow: `0 8px 24px -6px ${BRAND.dark}66`,
            }}
          >
            {draft.name[0]}
          </Avatar>
        </Badge>

        <div className="w-full flex flex-col gap-3">
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
        </div>

        {showSaveButton && (
          <Button
            fullWidth
            variant="contained"
            onClick={onSave}
            disabled={saving}
            sx={{ minHeight: 44, borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        )}
      </div>

      {/* ---------- CARD 2: APPEARANCE ---------- */}
      <div className="flex items-center justify-between gap-3 bg-app-bg rounded-2xl px-5 py-4 border border-app-border">
        <span className="text-sm font-medium text-app-text">Appearance</span>

        <ToggleButtonGroup
          size="small"
          value={mode}
          exclusive
          onChange={(e, value) => value && setMode(value)}
          aria-label="Appearance"
          sx={{ borderRadius: 999, '& .MuiToggleButton-root': { borderRadius: 999 } }}
        >
          <ToggleButton value="light" sx={{ gap: 0.5, px: 1.5, minHeight: 40, textTransform: 'none' }}>
            <LightModeIcon sx={{ fontSize: 16 }} /> Light
          </ToggleButton>
          <ToggleButton value="dark" sx={{ gap: 0.5, px: 1.5, minHeight: 40, textTransform: 'none' }}>
            <DarkModeIcon sx={{ fontSize: 16 }} /> Dark
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      {/* ---------- CARD 3: DANGER ZONE ---------- */}
      <div className="flex flex-col gap-2 bg-app-bg rounded-2xl px-5 py-4 border border-app-border">
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          sx={{ minHeight: 44, borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
        >
          Log out
        </Button>

        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlineIcon />}
          onClick={onDeleteAccount}
          sx={{ minHeight: 44, borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
        >
          Delete my account
        </Button>
      </div>
    </div>
  )
}

export default ProfilePanel
