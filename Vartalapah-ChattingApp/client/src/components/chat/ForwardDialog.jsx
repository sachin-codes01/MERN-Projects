import { useEffect, useMemo, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Checkbox, InputBase, CircularProgress,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useBackGuard } from '@/hooks/ui/useBackGuard.js'
import { useIsMobile } from '@/hooks/ui/useMediaQuery.js'
import ChatAvatar from '@/components/ui/ChatAvatar.jsx'
import { previewOf } from '@/utils/format.js'
import { fieldSx } from '@/styles/muiStyles.js'

// ==========================================================
// FORWARD DIALOG
//
// Ek message ko doosri chat/group me bhejne ke liye. Ek saath kai
// logon ko bhi bhej sakte ho (Instagram jaisa).
//
// Mobile par poori screen ka dialog - chhote dialog me list scroll
// karna aur keyboard dono ek saath nahi sambhalte
// ==========================================================
const ForwardDialog = ({ open, message, targets, onClose, onForward, sending }) => {
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const isMobile = useIsMobile()

  useBackGuard(open, onClose)

  // Har baar khulne par saaf slate
  useEffect(() => {
    if (open) {
      setSelected([])
      setSearch('')
    }
  }, [open])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q ? targets.filter((t) => t.name.toLowerCase().includes(q)) : targets

    // Jinse haal me baat hui wo upar - wahi sabse zyada forward kiye jate hain
    return [...list].sort((a, b) => {
      const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
      const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
      return bt - at
    })
  }, [targets, search])

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: isMobile
            ? { pt: 'var(--safe-top)', pb: 'var(--safe-bottom)' }
            : undefined,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>Forward to</DialogTitle>

      <DialogContent sx={{ px: 0, pb: 0 }}>
        {/* ---------- SEARCH ---------- */}
        <div className="px-6 pb-3">
          <div className="flex items-center gap-2 bg-app-bg rounded-full px-3 py-2 no-zoom-input">
            <SearchIcon fontSize="small" className="text-app-muted" />
            <InputBase
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people and groups..."
              className="plain-text w-full text-sm"
              sx={fieldSx}
              inputProps={{ 'aria-label': 'Search chats to forward to' }}
            />
          </div>
        </div>

        {/* ---------- PREVIEW ---------- */}
        {/* User ko dikhna chahiye ki wo bhej kya raha hai */}
        {message && (
          <div className="mx-6 mb-3 px-3 py-2 rounded-xl bg-app-bubble/60 flex items-center gap-2">
            {message.messageType === 'image' && (
              <img src={message.mediaUrl} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
            )}
            <p className="plain-text text-xs text-app-muted truncate">{previewOf(message)}</p>
          </div>
        )}

        {/* ---------- LIST ---------- */}
        <div className="max-h-[46vh] overflow-y-auto thin-scroll chat-scroll" role="listbox" aria-multiselectable="true">
          {rows.length === 0 && (
            <p className="text-center text-sm text-app-muted py-8">No chats found</p>
          )}

          {rows.map((row) => {
            const checked = selected.includes(row._id)

            return (
              <div
                key={row._id}
                role="option"
                aria-selected={checked}
                tabIndex={0}
                onClick={() => toggle(row._id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggle(row._id)
                  }
                }}
                className="flex items-center gap-3 px-6 py-2 cursor-pointer hover:bg-app-hover no-tap-flash"
                // 44px minimum touch target
                style={{ minHeight: 56 }}
              >
                <ChatAvatar user={row} size={38} />

                <p className="flex-1 min-w-0 text-sm truncate">{row.name}</p>

                <Checkbox checked={checked} tabIndex={-1} disableRipple inputProps={{ 'aria-hidden': true }} />
              </div>
            )
          })}
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} className="tap-target">Cancel</Button>
        <Button
          variant="contained"
          disabled={selected.length === 0 || sending}
          onClick={() => onForward(selected)}
          startIcon={sending ? <CircularProgress size={15} color="inherit" /> : null}
        >
          {sending ? 'Sending...' : `Send${selected.length ? ` (${selected.length})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ForwardDialog
