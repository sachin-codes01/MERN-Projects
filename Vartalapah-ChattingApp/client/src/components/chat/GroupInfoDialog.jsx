import { useState } from 'react'
import {
  Avatar, Badge, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import GroupsIcon from '@mui/icons-material/Groups'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import TextField from '@mui/material/TextField'
import ChatAvatar from '@/components/ui/ChatAvatar.jsx'
import MemberPicker from './MemberPicker.jsx'
import { useSelection } from '@/hooks/ui/useSelection.js'
import { useBackGuard } from '@/hooks/ui/useBackGuard.js'
import { IMAGE_ACCEPT } from '@/constants/media.js'
import { BRAND, DANGER } from '@/constants/theme.js'
import { dividerSx } from '@/styles/muiStyles.js'

// ==========================================================
// GROUP INFO DIALOG
//
// Members ki list, admin ke controls, aur leave/delete.
//
// Kaun kya kar sakta hai:
//   ADMIN  -> naam badle, photo badle, members jode/nikaale, group delete kare
//   MEMBER -> sirf dekhe, aur group chhod de
//
// Admin group CHHOD nahi sakta - warna group bina admin ke reh jata
// aur usme koi kabhi kuch badal hi nahi pata. Uske paas delete ka rasta hai
//
// Ye saare niyam backend par bhi hain (routes/groups.js) - yahan button
// chhupana sirf UI ki suvidha hai, asli rok server par lagti hai
// ==========================================================
const GroupInfoDialog = ({
  open,
  group,
  me,
  people,
  onClose,
  onRename,
  onRemoveMember,
  onAddMembers,
  onLeave,
  onDelete,
  groupImageInputRef,
  onGroupImageSelect,
  draftImage,
  saving,
}) => {
  const [draftName, setDraftName] = useState('')
  const [isAddingMembers, setIsAddingMembers] = useState(false)
  const newMembers = useSelection()

  useBackGuard(open && !!group, onClose)

  // Hooks ke BAAD hi return karna zaroori hai - warna React ka
  // "rules of hooks" toot jata hai (har render me hooks ka order same ho)
  if (!group) return null

  const isAdmin = group.isAdmin
  const memberIds = group.members.map((member) => member._id)

  // Jo pehle se member hain unhe dobara add nahi kar sakte
  const addablePeople = people.filter((person) => !memberIds.includes(person._id))

  const handleClose = () => {
    setIsAddingMembers(false)
    setDraftName('')
    newMembers.clear()
    onClose()
  }

  const stopAdding = () => {
    setIsAddingMembers(false)
    newMembers.clear()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Group Info</DialogTitle>

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

          {/* Photo sirf admin badal sakta hai */}
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              isAdmin ? (
                <IconButton
                  size="small"
                  aria-label="Change group photo"
                  onClick={() => groupImageInputRef.current.click()}
                  sx={{ bgcolor: BRAND.dark, width: 34, height: 34, '&:hover': { bgcolor: BRAND.hover } }}
                >
                  <PhotoCameraIcon sx={{ fontSize: 16, color: 'white' }} />
                </IconButton>
              ) : null
            }
          >
            <Avatar
              src={draftImage || group.groupImage}
              sx={{ width: 84, height: 84, bgcolor: BRAND.dark }}
            >
              <GroupsIcon />
            </Avatar>
          </Badge>

          {isAdmin ? (
            <div className="flex gap-2 w-full">
              <TextField
                label="Group name"
                fullWidth
                size="small"
                value={draftName || group.name}
                onChange={(event) => setDraftName(event.target.value)}
                className="no-zoom-input"
              />
              <Button
                variant="contained"
                size="small"
                disabled={saving}
                onClick={() => onRename((draftName || group.name).trim())}
                sx={{ minHeight: 44 }}
              >
                Save
              </Button>
            </div>
          ) : (
            <h3 className="text-lg font-semibold text-center">{group.name}</h3>
          )}

          <p className="text-xs text-app-muted">
            {group.members.length} members · created{' '}
            {new Date(group.createdAt).toLocaleDateString('en-IN')}
          </p>
        </div>

        <Divider sx={{ ...dividerSx, my: 2 }} />

        {/* ---------- MEMBERS ---------- */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Members</p>

          {isAdmin && !isAddingMembers && (
            <Button
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={() => setIsAddingMembers(true)}
              sx={{ minHeight: 40 }}
            >
              Add
            </Button>
          )}
        </div>

        {isAddingMembers ? (
          <>
            <MemberPicker
              people={addablePeople}
              selected={newMembers.selected}
              onToggle={newMembers.toggle}
            />

            <div className="flex gap-2 mt-2">
              <Button size="small" onClick={stopAdding} sx={{ minHeight: 40 }}>
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={newMembers.count === 0 || saving}
                onClick={() => onAddMembers(newMembers.selected, stopAdding)}
                sx={{ minHeight: 40 }}
              >
                Add {newMembers.count > 0 && `(${newMembers.count})`}
              </Button>
            </div>
          </>
        ) : (
          <ul className="max-h-52 overflow-y-auto thin-scroll chat-scroll mt-2">
            {group.members.map((member) => {
              const isGroupAdmin = member._id === group.admin._id
              const isMe = member._id === me._id

              return (
                <li key={member._id} className="flex items-center gap-2 py-1.5">
                  <ChatAvatar user={member} size={32} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{isMe ? 'You' : member.name}</p>
                    <p className="plain-text text-[11px] text-app-muted truncate">{member.email}</p>
                  </div>

                  {isGroupAdmin && (
                    <Chip label="Admin" size="small" color="primary" variant="outlined" />
                  )}

                  {/* Admin kisi bhi member ko nikaal sakta hai, khud ko nahi */}
                  {isAdmin && !isGroupAdmin && (
                    <IconButton
                      size="small"
                      className="tap-target"
                      aria-label={`Remove ${member.name} from group`}
                      onClick={() => onRemoveMember(member)}
                    >
                      <PersonRemoveIcon sx={{ fontSize: 18, color: DANGER }} />
                    </IconButton>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <Divider sx={{ ...dividerSx, my: 2 }} />

        {/* ---------- DANGER ZONE ---------- */}
        {isAdmin ? (
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={onDelete}
            sx={{ minHeight: 44 }}
          >
            Delete group
          </Button>
        ) : (
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={onLeave}
            sx={{ minHeight: 44 }}
          >
            Leave group
          </Button>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} sx={{ minHeight: 44 }}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default GroupInfoDialog
