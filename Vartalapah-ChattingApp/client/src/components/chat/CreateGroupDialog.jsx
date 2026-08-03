import { useState } from 'react'
import {
  Avatar, Badge, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, TextField,
} from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import MemberPicker from './MemberPicker.jsx'
import { useSelection } from '@/hooks/ui/useSelection.js'
import { useBackGuard } from '@/hooks/ui/useBackGuard.js'
import { IMAGE_ACCEPT } from '@/constants/media.js'
import { BRAND } from '@/constants/theme.js'
import { dividerSx } from '@/styles/muiStyles.js'

// Group ka naam itne akshar se chhota nahi ho sakta
// (backend par bhi yahi check hai - frontend par bharosa nahi karte)
const MIN_GROUP_NAME_LENGTH = 2

// ==========================================================
// CREATE GROUP DIALOG
//
// Group photo turant upload NAHI hoti - pehle sirf preview dikhta hai
// aur "Create group" dabane par hi Cloudinary par jati hai. Isse user
// photo chunkar Cancel kar de to bekaar upload nahi hoti
// ==========================================================
const CreateGroupDialog = ({
  open,
  onClose,
  people,
  onCreate,
  creating,
  groupImageInputRef,
  onGroupImageSelect,
  draftImage,
}) => {
  const [name, setName] = useState('')
  const members = useSelection()

  // Android ka back dialog band karta hai, website ko nahi
  useBackGuard(open, onClose)

  const handleClose = () => {
    setName('')
    members.clear()
    onClose()
  }

  const canCreate =
    !creating && name.trim().length >= MIN_GROUP_NAME_LENGTH && members.count > 0

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>New Group</DialogTitle>

      <DialogContent>
        <div className="flex flex-col items-center gap-3">
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            ref={groupImageInputRef}
            onChange={onGroupImageSelect}
            className="hidden"
            tabIndex={-1}
          />

          {/* Group photo optional hai - Badge se uske corner par camera button */}
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <IconButton
                size="small"
                aria-label="Choose group photo"
                onClick={() => groupImageInputRef.current.click()}
                sx={{ bgcolor: BRAND.dark, width: 34, height: 34, '&:hover': { bgcolor: BRAND.hover } }}
              >
                <PhotoCameraIcon sx={{ fontSize: 16, color: 'white' }} />
              </IconButton>
            }
          >
            <Avatar src={draftImage} sx={{ width: 76, height: 76, bgcolor: BRAND.dark }}>
              <GroupsIcon />
            </Avatar>
          </Badge>

          <TextField
            label="Group name"
            fullWidth
            size="small"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="no-zoom-input"
          />
        </div>

        <Divider sx={{ ...dividerSx, my: 2 }} />

        <p className="text-sm font-semibold">
          Add members {members.count > 0 && `(${members.count} selected)`}
        </p>
        <p className="text-[11px] text-app-muted">Only people from your Chats and Requests</p>

        <MemberPicker people={people} selected={members.selected} onToggle={members.toggle} />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} sx={{ minHeight: 44 }}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!canCreate}
          onClick={() => onCreate(name.trim(), members.selected, handleClose)}
          sx={{ minHeight: 44 }}
        >
          {creating ? 'Creating...' : 'Create group'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateGroupDialog
