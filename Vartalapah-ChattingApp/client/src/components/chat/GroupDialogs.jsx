import { useState } from 'react'
import {
  Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Badge, Checkbox, InputBase, Divider, CircularProgress, Chip,
} from '@mui/material'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import GroupsIcon from '@mui/icons-material/Groups'
import SearchIcon from '@mui/icons-material/Search'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LogoutIcon from '@mui/icons-material/Logout'

// ==========================================================
// GROUP DIALOGS
// Do popup yahan hain: naya group banana, aur group ki info/settings
// Inhe alag file me rakha kyunki Dialogs.jsx pehle hi bada tha
// ==========================================================

// ---------- Members chunne wali common list ----------
// Create dialog aur "Add members" dono me yahi use hoti hai
const MemberPicker = ({ people, selected, onToggle }) => {
  const [q, setQ] = useState('')

  const filtered = people.filter((u) =>
    u.name.toLowerCase().includes(q.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(q.toLowerCase())
  )

  return (
    <>
      <div className="flex items-center gap-2 bg-app-bg rounded-full px-3 py-1.5 mt-2">
        <SearchIcon fontSize="small" className="text-app-muted" />
        <InputBase
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people..."
          className="w-full text-sm"
          sx={{ color: '#f1f5f9' }}
        />
      </div>

      <div className="max-h-52 overflow-y-auto thin-scroll mt-2">
        {filtered.length === 0 && (
          <div className="text-center py-4 px-2">
            <p className="text-sm text-app-muted">
              {q ? 'No people found' : 'Nobody available to add'}
            </p>
            {!q && (
              // Rule samjha dete hain warna user confuse hoga ki list khali kyun hai
              <p className="text-xs text-app-muted mt-1">
                You can only add people you have already chatted with. Send them a
                message first from "All people".
              </p>
            )}
          </div>
        )}

        {filtered.map((u) => (
          <div
            key={u._id}
            onClick={() => onToggle(u._id)}
            className="flex items-center gap-2 py-1.5 px-1 cursor-pointer hover:bg-app-hover rounded"
          >
            <Checkbox size="small" checked={selected.includes(u._id)} />
            <Avatar src={u.profileImage} sx={{ width: 30, height: 30, bgcolor: '#7c3aed' }}>
              {u.name[0]}
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm truncate">{u.name}</p>
              <p className="text-[11px] text-app-muted truncate">{u.email}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ==========================================================
// CREATE GROUP DIALOG
// ==========================================================
export const CreateGroupDialog = ({
  open, onClose, people, onCreate, creating,
  groupImageInputRef, onGroupImageSelect, draftImage,
}) => {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState([])

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleClose = () => {
    setName('')
    setSelected([])
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>New Group</DialogTitle>

      <DialogContent>
        <div className="flex flex-col items-center gap-3">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={groupImageInputRef}
            onChange={onGroupImageSelect}
            className="hidden"
          />

          {/* Group photo - optional hai */}
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <IconButton
                size="small"
                onClick={() => groupImageInputRef.current.click()}
                sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
              >
                <PhotoCameraIcon sx={{ fontSize: 15, color: 'white' }} />
              </IconButton>
            }
          >
            <Avatar src={draftImage} sx={{ width: 76, height: 76, bgcolor: '#7c3aed' }}>
              <GroupsIcon />
            </Avatar>
          </Badge>

          <TextField
            label="Group name"
            fullWidth
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <Divider sx={{ borderColor: '#334155', my: 2 }} />

        <p className="text-sm font-semibold">
          Add members {selected.length > 0 && `(${selected.length} selected)`}
        </p>
        <p className="text-[11px] text-app-muted">
          Only people from your Chats and Requests
        </p>

        <MemberPicker people={people} selected={selected} onToggle={toggle} />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={creating || name.trim().length < 2 || selected.length === 0}
          onClick={() => onCreate(name.trim(), selected, handleClose)}
        >
          {creating ? 'Creating...' : 'Create group'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ==========================================================
// GROUP INFO DIALOG
// Members list, admin ke controls, leave/delete
// ==========================================================
export const GroupInfoDialog = ({
  open, group, me, people, onClose,
  onRename, onRemoveMember, onAddMembers, onLeave, onDelete,
  groupImageInputRef, onGroupImageSelect, draftImage, saving,
}) => {
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState([])

  if (!group) return null

  const isAdmin = group.isAdmin
  const memberIds = group.members.map((m) => m._id)

  // Jo pehle se member nahi hain, sirf wahi add kiye ja sakte hain
  const addable = people.filter((u) => !memberIds.includes(u._id))

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleClose = () => {
    setAdding(false)
    setSelected([])
    setName('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Group Info</DialogTitle>

      <DialogContent>
        <div className="flex flex-col items-center gap-3">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={groupImageInputRef}
            onChange={onGroupImageSelect}
            className="hidden"
          />

          {/* Photo sirf admin badal sakta hai */}
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              isAdmin ? (
                <IconButton
                  size="small"
                  onClick={() => groupImageInputRef.current.click()}
                  sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
                >
                  <PhotoCameraIcon sx={{ fontSize: 15, color: 'white' }} />
                </IconButton>
              ) : null
            }
          >
            <Avatar
              src={draftImage || group.groupImage}
              sx={{ width: 84, height: 84, bgcolor: '#7c3aed' }}
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
                value={name || group.name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button
                variant="contained"
                size="small"
                disabled={saving}
                onClick={() => onRename((name || group.name).trim())}
              >
                Save
              </Button>
            </div>
          ) : (
            <h3 className="text-lg font-semibold">{group.name}</h3>
          )}

          <p className="text-xs text-app-muted">
            {group.members.length} members · created{' '}
            {new Date(group.createdAt).toLocaleDateString('en-IN')}
          </p>
        </div>

        <Divider sx={{ borderColor: '#334155', my: 2 }} />

        {/* ---------- MEMBERS LIST ---------- */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Members</p>

          {/* Members sirf admin add kar sakta hai */}
          {isAdmin && !adding && (
            <Button size="small" startIcon={<PersonAddIcon />} onClick={() => setAdding(true)}>
              Add
            </Button>
          )}
        </div>

        {adding ? (
          <>
            <MemberPicker people={addable} selected={selected} onToggle={toggle} />
            <div className="flex gap-2 mt-2">
              <Button size="small" onClick={() => { setAdding(false); setSelected([]) }}>
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={selected.length === 0 || saving}
                onClick={() => onAddMembers(selected, () => { setAdding(false); setSelected([]) })}
              >
                Add {selected.length > 0 && `(${selected.length})`}
              </Button>
            </div>
          </>
        ) : (
          <div className="max-h-52 overflow-y-auto thin-scroll mt-2">
            {group.members.map((m) => {
              const isTheAdmin = m._id === group.admin._id
              const isMe = m._id === me._id

              return (
                <div key={m._id} className="flex items-center gap-2 py-1.5">
                  <Avatar src={m.profileImage} sx={{ width: 32, height: 32, bgcolor: '#7c3aed' }}>
                    {m.name[0]}
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {isMe ? 'You' : m.name}
                    </p>
                    <p className="text-[11px] text-app-muted truncate">{m.email}</p>
                  </div>

                  {isTheAdmin && <Chip label="Admin" size="small" color="primary" variant="outlined" />}

                  {/* Admin kisi bhi member ko nikaal sakta hai (khud ko nahi) */}
                  {isAdmin && !isTheAdmin && (
                    <IconButton size="small" title="Remove" onClick={() => onRemoveMember(m)}>
                      <PersonRemoveIcon sx={{ fontSize: 18, color: '#f87171' }} />
                    </IconButton>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <Divider sx={{ borderColor: '#334155', my: 2 }} />

        {/* ---------- DANGER ZONE ---------- */}
        {isAdmin ? (
          // Admin group chhod nahi sakta - warna group bina admin ke reh jayega
          <Button fullWidth variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={onDelete}>
            Delete group
          </Button>
        ) : (
          <Button fullWidth variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={onLeave}>
            Leave group
          </Button>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
