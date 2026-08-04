import {
  Avatar, Button, Dialog, DialogActions, DialogContent,
} from '@mui/material'
import BlockIcon from '@mui/icons-material/Block'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { lastSeenText } from '@/utils/format.js'
import { useBackGuard } from '@/hooks/ui/useBackGuard.js'
import { useIsMobile } from '@/hooks/ui/useMediaQuery.js'
import { BRAND } from '@/constants/theme.js'
import UserIdentity from '@/components/ui/UserIdentity.jsx'

// ==========================================================
// USER PROFILE DIALOG
// Saamne wale banda ki profile - chat ke header par tap karne se khulti hai
//
// Do khatre wale actions yahin hain:
//   Block          -> dono taraf message band (server par lagta hai)
//   Unsend all     -> maine jo bheja wo sab mit jata hai, uska bacha rehta hai
// ==========================================================
const UserProfileDialog = ({ user, onClose, onBlockToggle, onUnsendAll }) => {
  const isMobile = useIsMobile()
  const isOpen = !!user

  // Android ka back dialog band kare, website ko nahi
  useBackGuard(isOpen, onClose)

  // Mobile par chhota dialog + keyboard theek se nahi baithte,
  // isliye wahan poori screen le lete hain (safe area ka khyaal rakhkar)
  const mobileProps = isMobile
    ? {
        fullScreen: true,
        slotProps: { paper: { sx: { pt: 'var(--safe-top)', pb: 'var(--safe-bottom)' } } },
      }
    : {}

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs" {...mobileProps}>
      <DialogContent>
        <div className="flex flex-col items-center gap-2 py-4">
          <Avatar
            src={user?.profileImage}
            sx={{ width: 96, height: 96, bgcolor: BRAND.dark, fontSize: 36 }}
          >
            {user?.name[0]}
          </Avatar>

          {/* Deleted account ka email dikhane ka koi matlab nahi */}
          <UserIdentity
            name={user?.name}
            email={!user?.isDeleted ? user?.email : ''}
            align="center"
            size="lg"
            className="mt-2"
          />

          <p className={`text-sm mt-1 ${user?.isOnline ? 'text-green-400' : 'text-app-muted'}`}>
            {user?.isDeleted
              ? 'Account deleted'
              : user?.isBlocked
              ? 'You blocked this user'
              : user?.isOnline
              ? 'Online'
              : lastSeenText(user?.lastSeen)}
          </p>

          {user && !user.isDeleted && (
            <p className="text-xs text-app-muted mt-2">
              Joined {new Date(user.createdAt).toLocaleDateString('en-IN')}
            </p>
          )}
        </div>

        {/* Deleted account par koi action nahi bachta */}
        {user && !user.isDeleted && (
          <div className="flex flex-col gap-2 pb-2">
            <Button
              fullWidth
              variant="outlined"
              color={user.isBlocked ? 'success' : 'error'}
              startIcon={user.isBlocked ? <LockOpenIcon /> : <BlockIcon />}
              onClick={onBlockToggle}
              sx={{ minHeight: 44 }}
            >
              {user.isBlocked ? 'Unblock user' : 'Block user'}
            </Button>

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
        <Button onClick={onClose} sx={{ minHeight: 44 }}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default UserProfileDialog
