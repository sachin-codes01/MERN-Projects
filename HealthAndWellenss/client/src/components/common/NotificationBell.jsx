import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Tooltip from '@mui/material/Tooltip'
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined'
import EventAvailable from '@mui/icons-material/EventAvailable'
import EventBusy from '@mui/icons-material/EventBusy'
import Alarm from '@mui/icons-material/Alarm'
import LocalOffer from '@mui/icons-material/LocalOffer'
import PersonAdd from '@mui/icons-material/PersonAdd'
import Star from '@mui/icons-material/Star'
import Spa from '@mui/icons-material/Spa'
import { customerApi, staffApi } from '../../api/index.js'
import { useToast } from '../../context/FeedbackContext.jsx'
import { timeAgo } from '../../utils/format.js'

const POLL_MS = 60 * 1000 // har 1 minute me nayi notifications check

const ICONS = {
  booking: <EventAvailable fontSize="small" />,
  cancellation: <EventBusy fontSize="small" />,
  reminder: <Alarm fontSize="small" />,
  offer: <LocalOffer fontSize="small" />,
  registration: <PersonAdd fontSize="small" />,
  feedback: <Star fontSize="small" />,
  visit: <Spa fontSize="small" />,
}

// Bell icon + unread count + list. Nayi notification aaye to toast popup bhi dikhta hai
const NotificationBell = ({ role = 'customer' }) => {
  const api = role === 'staff' ? staffApi : customerApi
  const [anchor, setAnchor] = useState(null)
  const [data, setData] = useState({ items: [], unread: 0 })
  const seenIds = useRef(null)
  const navigate = useNavigate()
  const toast = useToast()

  // Server se list laao; pehli baar ke baad jo nayi unread aayi uska popup bhi
  const handleData = useCallback(
    (result) => {
      const items = result.items
      if (seenIds.current) {
        const fresh = items.find((n) => !n.isRead && !seenIds.current.has(n._id))
        if (fresh) toast.info(fresh.title)
      }
      seenIds.current = new Set(items.map((n) => n._id))
      setData(result)
    },
    [toast],
  )

  useEffect(() => {
    let active = true
    // bell fail ho to page na toote — chup-chaap agli baar try
    const fetchNow = () =>
      api
        .notifications()
        .then((res) => active && handleData(res.data))
        .catch(() => {})
    fetchNow()
    const id = setInterval(() => document.visibilityState === 'visible' && fetchNow(), POLL_MS)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [api, handleData])

  const markAllRead = async () => {
    setData((d) => ({ unread: 0, items: d.items.map((n) => ({ ...n, isRead: true })) }))
    await api.readNotifications().catch(() => {})
  }

  const openItem = async (n) => {
    setAnchor(null)
    if (!n.isRead) {
      setData((d) => ({
        unread: Math.max(d.unread - 1, 0),
        items: d.items.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)),
      }))
      api.readNotifications(n._id).catch(() => {})
    }
    if (n.link) navigate(n.link)
  }

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton aria-label={`${data.unread} unread notifications`} onClick={(e) => setAnchor(e.currentTarget)}>
          <Badge badgeContent={data.unread} color="secondary" max={9}>
            <NotificationsOutlined />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 'min(380px, calc(100vw - 24px))', maxHeight: 480, mt: 1 } } }}
      >
        <div className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
          <p className="font-serif text-xl font-semibold text-brand-700">Notifications</p>
          {data.unread > 0 && (
            <Button size="small" onClick={markAllRead}>
              Mark all as read
            </Button>
          )}
        </div>
        {data.items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">You're all caught up!</p>
        ) : (
          <ul>
            {data.items.map((n) => (
              <li key={n._id}>
                <button
                  onClick={() => openItem(n)}
                  className={`flex w-full gap-3 border-b border-brand-50 px-4 py-3 text-left transition hover:bg-brand-50 ${n.isRead ? '' : 'bg-gold-100/40'}`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                    {ICONS[n.type] || <NotificationsOutlined fontSize="small" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink">{n.title}</span>
                      {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-gold-500" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-muted/80">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Popover>
    </>
  )
}

export default NotificationBell
