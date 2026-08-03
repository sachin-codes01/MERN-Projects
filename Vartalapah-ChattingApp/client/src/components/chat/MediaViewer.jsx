import { useCallback, useEffect, useRef, useState } from 'react'
import { IconButton, CircularProgress } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import IosShareIcon from '@mui/icons-material/IosShare'
import ForwardIcon from '@mui/icons-material/Forward'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useBackGuard } from '../../hooks/useBackGuard.js'
import { timeOf } from '../../utils/format.js'

// ==========================================================
// MEDIA VIEWER - poori screen wala photo/video viewer
//
// Instagram/WhatsApp jaisa:
//   - photo par pinch se zoom, zoom ke baad ungli se pan
//   - double tap par zoom in/out
//   - daayein-baayein swipe se chat ki agli/pichhli media
//   - neeche swipe karke band
//   - video par normal controls (play/pause/fullscreen browser deta hai)
//
// Sab kuch Pointer Events se hai (touch + mouse + pen ek hi code me).
// Zoom/pan ki value React state me NAHI rakhi - har frame par setState
// karne se ungli ke peeche laag dikhti hai. Isliye ref me rakhkar
// seedha DOM ka transform badalte hain, aur state sirf tab chhedte hain
// jab kuch "bada" badle (slide badalna, zoom on/off)
// ==========================================================

const MAX_SCALE = 4
const MIN_SCALE = 1
const DOUBLE_TAP_SCALE = 2.5

// Itna neeche kheencho to viewer band
const DISMISS_DISTANCE = 110

// Do tap ke beech itne ms se kam ho to "double tap"
const DOUBLE_TAP_MS = 280

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

// Do ungliyon ke beech ka faasla - pinch zoom ka aadhaar
const distanceBetween = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

const MediaViewer = ({ open, items, startIndex = 0, onClose, onDownload, onShare, onForward }) => {
  const [index, setIndex] = useState(startIndex)
  const [zoomed, setZoomed] = useState(false)
  const [loading, setLoading] = useState(true)

  const trackRef = useRef(null)   // saari slides ek line me
  const stageRef = useRef(null)   // gestures isi par lagti hain
  const imageRef = useRef(null)   // abhi dikh rahi image

  // Ek object me poori gesture ki haalat - render ke beech bani rehti hai
  const gesture = useRef({
    pointers: new Map(),
    scale: 1,
    tx: 0,          // zoom ke baad image kitni khiskI hui hai
    ty: 0,
    startScale: 1,
    startDistance: 0,
    startX: 0,
    startY: 0,
    dragX: 0,       // slide badalne wala horizontal drag
    dragY: 0,       // band karne wala vertical drag
    mode: null,     // 'swipe' | 'pan' | 'pinch'
    lastTapAt: 0,
  })

  const current = items[index]
  const isVideo = current?.messageType === 'video'

  // Back dabao -> viewer band, chat wahin ki wahin
  useBackGuard(open, onClose)

  // ---------- DOM par transform lagane wale do helper ----------
  // Inhe render ke bahar se bhi bulaya jata hai, isliye useCallback

  const applyImageTransform = useCallback((animated = false) => {
    const el = imageRef.current
    if (!el) return

    const { scale, tx, ty } = gesture.current

    el.classList.toggle('media-img-animated', animated)
    el.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`
  }, [])

  const applyTrackTransform = useCallback((animated = false, atIndex = index) => {
    const el = trackRef.current
    if (!el) return

    const { dragX, dragY } = gesture.current

    el.style.transition = animated ? 'transform 0.24s cubic-bezier(0.22,1,0.36,1)' : 'none'
    el.style.transform = `translate3d(calc(${-atIndex * 100}% + ${dragX}px), ${dragY}px, 0)`

    // Neeche kheenchne par background dheere dheere transparent - user ko
    // saaf dikhta hai ki chhodte hi band ho jayega
    if (stageRef.current) {
      stageRef.current.style.opacity = String(clamp(1 - Math.abs(dragY) / 400, 0.35, 1))
    }
  }, [index])

  // Zoom reset - slide badalte waqt aur viewer khulte waqt
  const resetZoom = useCallback(
    (animated = false) => {
      const g = gesture.current
      g.scale = 1
      g.tx = 0
      g.ty = 0
      setZoomed(false)
      applyImageTransform(animated)
    },
    [applyImageTransform]
  )

  // Viewer khulte hi sahi slide par pahunch jao
  useEffect(() => {
    if (!open) return

    setIndex(startIndex)
    setLoading(true)
    resetZoom()

    const g = gesture.current
    g.dragX = 0
    g.dragY = 0
    g.pointers.clear()
  }, [open, startIndex, resetZoom])

  // Slide badli - track ko wahan le jao aur zoom hata do
  useEffect(() => {
    if (!open) return

    gesture.current.dragX = 0
    gesture.current.dragY = 0
    resetZoom()
    applyTrackTransform(true, index)
  }, [index, open, applyTrackTransform, resetZoom])

  const goTo = useCallback(
    (next) => {
      const clamped = clamp(next, 0, items.length - 1)
      if (clamped !== index) setLoading(true)
      setIndex(clamped)
    },
    [index, items.length]
  )

  // ---------- KEYBOARD ----------
  // Desktop par arrow keys se slide, Escape se band
  useEffect(() => {
    if (!open) return

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goTo(index - 1)
      else if (e.key === 'ArrowRight') goTo(index + 1)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, goTo, onClose])

  // ==========================================================
  // GESTURES
  // ==========================================================

  const onPointerDown = (e) => {
    // Video ke controls par ungli rakhi hai to gesture nahi chalani -
    // warna play/pause/seek kabhi kaam nahi karega
    if (e.target.tagName === 'VIDEO') return

    const g = gesture.current
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    // Ungli chhoot jane par bhi events milte rahein
    e.currentTarget.setPointerCapture?.(e.pointerId)

    if (g.pointers.size === 2) {
      // ---- PINCH shuru ----
      const [a, b] = [...g.pointers.values()]
      g.startDistance = distanceBetween(a, b)
      g.startScale = g.scale
      g.mode = 'pinch'
      return
    }

    g.startX = e.clientX
    g.startY = e.clientY

    // Zoom hai to ungli image ko khiskayegi, warna slide/dismiss
    g.mode = g.scale > MIN_SCALE ? 'pan' : 'swipe'
  }

  const onPointerMove = (e) => {
    const g = gesture.current
    if (!g.pointers.has(e.pointerId)) return

    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    // ---- PINCH ----
    if (g.mode === 'pinch' && g.pointers.size === 2) {
      const [a, b] = [...g.pointers.values()]
      const ratio = distanceBetween(a, b) / (g.startDistance || 1)

      g.scale = clamp(g.startScale * ratio, MIN_SCALE, MAX_SCALE)

      // Zoom wapas 1 par aaya to image bilkul beech me set kar do
      if (g.scale === MIN_SCALE) {
        g.tx = 0
        g.ty = 0
      }

      applyImageTransform()
      return
    }

    const dx = e.clientX - g.startX
    const dy = e.clientY - g.startY

    // ---- PAN (zoom ke baad image ghumana) ----
    if (g.mode === 'pan') {
      g.tx += e.movementX ?? 0
      g.ty += e.movementY ?? 0
      applyImageTransform()
      return
    }

    // ---- SWIPE ----
    if (g.mode !== 'swipe') return

    // Pehli baar me tay kar lete hain ki ye horizontal (slide) hai ya
    // vertical (band karna). Beech me badalne se gesture "phisalta" lagta hai
    if (Math.abs(dx) > Math.abs(dy)) {
      g.dragY = 0

      // Pehli/aakhri slide par thoda sa hi khiske - resistance
      const atEdge = (dx > 0 && index === 0) || (dx < 0 && index === items.length - 1)
      g.dragX = atEdge ? dx * 0.28 : dx
    } else {
      g.dragX = 0
      // Neeche kheenchna hi band karta hai, upar nahi
      g.dragY = dy > 0 ? dy : dy * 0.25
    }

    applyTrackTransform(false, index)
  }

  const onPointerUp = (e) => {
    const g = gesture.current
    g.pointers.delete(e.pointerId)

    // ---- PINCH khatam ----
    if (g.mode === 'pinch') {
      if (g.pointers.size < 2) {
        g.mode = g.scale > MIN_SCALE ? 'pan' : 'swipe'
        setZoomed(g.scale > MIN_SCALE)
        applyImageTransform(true)
      }
      return
    }

    if (g.mode === 'pan') {
      setZoomed(g.scale > MIN_SCALE)
      return
    }

    // ---- DOUBLE TAP ----
    // Sirf tab jab ungli hili hi na ho (warna swipe ko tap samajh lenge)
    const moved = Math.abs(g.dragX) > 8 || Math.abs(g.dragY) > 8
    const now = Date.now()

    if (!moved && !isVideo) {
      if (now - g.lastTapAt < DOUBLE_TAP_MS) {
        g.lastTapAt = 0
        g.scale = g.scale > MIN_SCALE ? MIN_SCALE : DOUBLE_TAP_SCALE
        g.tx = 0
        g.ty = 0

        setZoomed(g.scale > MIN_SCALE)
        applyImageTransform(true)
        return
      }

      g.lastTapAt = now
    }

    // ---- SWIPE khatam ----
    const width = stageRef.current?.clientWidth || window.innerWidth

    if (g.dragY > DISMISS_DISTANCE) {
      onClose()
      return
    }

    // Screen ke chauthai se zyada khiska to slide badal do
    if (Math.abs(g.dragX) > width / 4) {
      const next = index + (g.dragX < 0 ? 1 : -1)
      g.dragX = 0
      g.dragY = 0
      goTo(next)
      return
    }

    // Kuch nahi hua - wapas apni jagah
    g.dragX = 0
    g.dragY = 0
    applyTrackTransform(true, index)
  }

  if (!open || !current) return null

  return (
    <div
      className="fixed inset-0 z-[1400] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      {/* ---------- TOP BAR ---------- */}
      {/* Notch/status bar ke neeche - pt-safe iska poora hisaab rakhta hai */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-safe px-safe bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-1 px-2 py-2">
          <IconButton onClick={onClose} className="tap-target" aria-label="Close viewer" sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>

          <div className="flex-1 min-w-0 text-white">
            <p className="text-sm truncate">{isVideo ? 'Video' : 'Photo'}</p>
            <p className="plain-text text-[11px] text-white/70">
              {timeOf(current.createdAt)}
              {items.length > 1 && ` · ${index + 1} of ${items.length}`}
            </p>
          </div>

          {onForward && (
            <IconButton
              onClick={() => onForward(current)}
              className="tap-target"
              aria-label="Forward"
              sx={{ color: 'white' }}
            >
              <ForwardIcon />
            </IconButton>
          )}

          {onShare && (
            <IconButton
              onClick={() => onShare(current)}
              className="tap-target"
              aria-label="Share"
              sx={{ color: 'white' }}
            >
              <IosShareIcon />
            </IconButton>
          )}

          <IconButton
            onClick={() => onDownload(current)}
            className="tap-target"
            aria-label="Download"
            sx={{ color: 'white' }}
          >
            <DownloadIcon />
          </IconButton>
        </div>
      </div>

      {/* ---------- STAGE ---------- */}
      {/* touch-action: none (media-stage class) taaki browser apna zoom/scroll
          na chalaye - saara gesture hamara hai */}
      <div
        ref={stageRef}
        className="media-stage absolute inset-0 overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div ref={trackRef} className="flex h-full w-full will-change-transform">
          {items.map((item, i) => (
            <div
              key={item._id}
              className="shrink-0 w-full h-full flex items-center justify-center"
              // Sirf dikh rahi slide screen reader ko sunayi de
              aria-hidden={i !== index}
            >
              {/* Door wali slides render karna zaroori nahi - do se zyada
                  door hain to unki jagah khali dabba (memory aur decode dono bachte hain) */}
              {Math.abs(i - index) > 1 ? null : item.messageType === 'video' ? (
                <video
                  src={item.mediaUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-w-full max-h-full"
                  onLoadedData={() => i === index && setLoading(false)}
                />
              ) : (
                <img
                  ref={i === index ? imageRef : null}
                  src={item.mediaUrl}
                  alt="Full screen media"
                  draggable={false}
                  className="max-w-full max-h-full select-none will-change-transform"
                  onLoad={() => i === index && setLoading(false)}
                />
              )}
            </div>
          ))}
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <CircularProgress size={30} sx={{ color: 'white' }} />
          </div>
        )}
      </div>

      {/* ---------- DESKTOP ARROWS ---------- */}
      {/* Mobile par swipe hai, isliye ye sirf md+ par dikhte hain */}
      {items.length > 1 && (
        <>
          <IconButton
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous"
            className="!hidden md:!flex tap-target"
            sx={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'white', bgcolor: 'rgba(0,0,0,0.4)',
              '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>

          <IconButton
            onClick={() => goTo(index + 1)}
            disabled={index === items.length - 1}
            aria-label="Next"
            className="!hidden md:!flex tap-target"
            sx={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'white', bgcolor: 'rgba(0,0,0,0.4)',
              '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </>
      )}

      {/* Pehli baar wale user ke liye chhota sa ishara */}
      {!zoomed && !isVideo && (
        <p className="absolute bottom-0 left-0 right-0 pb-safe text-center text-[11px] text-white/50 pointer-events-none">
          <span className="inline-block pb-3">Pinch or double tap to zoom · Swipe down to close</span>
        </p>
      )}
    </div>
  )
}

export default MediaViewer
