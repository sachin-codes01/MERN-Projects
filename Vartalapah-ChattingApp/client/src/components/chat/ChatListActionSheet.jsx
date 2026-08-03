import ArchiveIcon from '@mui/icons-material/Archive'
import BlockIcon from '@mui/icons-material/Block'
import GroupsIcon from '@mui/icons-material/Groups'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import PushPinIcon from '@mui/icons-material/PushPin'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import ActionSheet from '@/components/ui/ActionSheet.jsx'

// ==========================================================
// CHAT LIST ACTION SHEET
//
// Sidebar ki kisi row par LONG PRESS (mobile) ya RIGHT CLICK (desktop)
// karne par jo actions aate hain.
//
// Group aur aadmi ke actions alag hain:
//   GROUP -> sirf "Group info" (group ko pin/block karne ka matlab nahi)
//   AADMI -> pin, archive, block, aur list se hatana
//
// Dikhne wala roop ActionSheet tay karta hai: touch device par neeche
// se uthta hua sheet, mouse par chhota menu
// ==========================================================
const ChatListActionSheet = ({ listMenu, onClose, onToggleRelation, onOpenGroupInfo }) => {
  const row = listMenu?.user

  const groupActions = [
    {
      key: 'info',
      label: 'Group info',
      icon: <GroupsIcon fontSize="small" />,
      onClick: onOpenGroupInfo,
    },
  ]

  const personActions = [
    {
      key: 'pin',
      label: row?.isPinned ? 'Unpin' : 'Pin to top',
      icon: <PushPinIcon fontSize="small" />,
      onClick: () => onToggleRelation('pinned', !row?.isPinned),
    },
    {
      key: 'archive',
      label: row?.isArchived ? 'Unarchive' : 'Archive chat',
      icon: row?.isArchived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />,
      onClick: () => onToggleRelation('archived', !row?.isArchived),
    },
    {
      key: 'block',
      label: row?.isBlocked ? 'Unblock' : 'Block',
      icon: row?.isBlocked ? <LockOpenIcon fontSize="small" /> : <BlockIcon fontSize="small" />,
      onClick: () => onToggleRelation('blocked', !row?.isBlocked),
    },
    { key: 'divider', divider: true },
    {
      // Sirf list se hatata hai - messages database me rehte hain. Wo
      // dobara message bhejein to banda apne aap wapas list me aa jata hai
      key: 'hide',
      label: 'Remove from list',
      subtitle: 'Messages are kept',
      icon: <PersonRemoveIcon fontSize="small" />,
      danger: true,
      onClick: () => onToggleRelation('hidden', true),
    },
  ]

  return (
    <ActionSheet
      open={!!listMenu}
      onClose={onClose}
      items={row?.isGroup ? groupActions : personActions}
      anchorPosition={listMenu?.point}
      title={row?.name}
      ariaLabel="Chat options"
    />
  )
}

export default ChatListActionSheet
