import { useCallback, useEffect, useRef } from 'react'
import { LONG_PRESS_MOVE_TOLERANCE_PX, LONG_PRESS_MS } from '@/constants/chat.js'

// ==========================================================
// useLongPress - MOBILE ka "right click"
//
// Purana code sirf ek setTimeout tha. Wo teen jagah tootta tha:
//
//   1. List scroll karte waqt ungli ek jagah ruk jaye to menu khul jata tha
//   2. iOS apna khud ka "Copy / Look Up" wala popup upar chipka deta tha
//   3. Ungli thodi si hili to bhi timer chalta rehta tha
//
// Ye hook teeno theek karta hai:
//   - 10px se zyada ungli khiskI to press cancel (scroll karne diya jaye)
//   - contextmenu event ko rok dete hain (native popup nahi aata)
//   - long press ke baad wala "click" bhi khaa jate hain, warna menu
//     khulte hi neeche wali chat bhi khul jati thi
//
// Desktop par right click seedha wahi menu kholta hai - dono ke liye
// ek hi callback, isliye action list kabhi alag nahi ho sakti
// ==========================================================

export const useLongPress = ({ onLongPress, onClick, delay = LONG_PRESS_MS, disabled = false }) => {
  const timerRef = useRef(null)
  const startRef = useRef(null)   // ungli kahan rakhi thi
  const firedRef = useRef(false)  // long press chal chuka hai?

  // Callbacks ref me rakhte hain taaki handlers har render par naye na banein
  // (warna har message row har render par naye props leta aur memo bekaar ho jata)
  const longPressRef = useRef(onLongPress)
  const clickRef = useRef(onClick)
  longPressRef.current = onLongPress
  clickRef.current = onClick

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startRef.current = null
  }, [])

  // Component hat jaye to chalta hua timer bhi band
  useEffect(() => clear, [clear])

  const handleTouchStart = useCallback(
    (e) => {
      if (disabled) return

      // Do ungli (pinch/zoom) par long press nahi
      if (e.touches.length !== 1) return clear()

      const touch = e.touches[0]
      startRef.current = { x: touch.clientX, y: touch.clientY }
      firedRef.current = false

      timerRef.current = setTimeout(() => {
        firedRef.current = true
        timerRef.current = null

        // Halka sa vibration - user ko pata chalta hai ki press pakda gaya.
        // Sab browser support nahi karte, isliye optional chaining
        navigator.vibrate?.(12)

        longPressRef.current?.({ x: touch.clientX, y: touch.clientY, source: 'touch' })
      }, delay)
    },
    [clear, delay, disabled]
  )

  const handleTouchMove = useCallback(
    (e) => {
      const start = startRef.current
      if (!start || !timerRef.current) return

      const touch = e.touches[0]
      const moved =
        Math.abs(touch.clientX - start.x) > LONG_PRESS_MOVE_TOLERANCE_PX ||
        Math.abs(touch.clientY - start.y) > LONG_PRESS_MOVE_TOLERANCE_PX

      // User scroll karna chahta hai, menu nahi kholna
      if (moved) clear()
    },
    [clear]
  )

  const handleTouchEnd = useCallback(
    (e) => {
      clear()

      // Long press ho chuka hai to uske baad aane wale click ko rok do.
      // Warna menu khulte hi neeche wali chat bhi khul jati hai
      if (firedRef.current) {
        e.preventDefault()
        firedRef.current = false
      }
    },
    [clear]
  )

  // Desktop ka right click + mobile ka native "Copy/Look Up" popup - dono
  // yahin ruk jate hain. Mobile par hamara apna sheet pehle hi khul chuka hota hai
  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault()
      if (disabled) return

      // Touch se aaya contextmenu (kuch Android browser bhejte hain) -
      // uspar dobara sheet mat kholo, timer already khol chuka hai
      if (e.pointerType === 'touch' || firedRef.current) return

      longPressRef.current?.({ x: e.clientX, y: e.clientY, source: 'mouse' })
    },
    [disabled]
  )

  const handleClick = useCallback((e) => {
    // touchend ne preventDefault kiya tha lekin kuch browser phir bhi
    // click bhejte hain - yahan dusri surakcha
    if (firedRef.current) {
      firedRef.current = false
      return
    }
    clickRef.current?.(e)
  }, [])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: clear,
    onContextMenu: handleContextMenu,
    onClick: handleClick,
  }
}
