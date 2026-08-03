import { useEffect, useRef, useState } from 'react'

// ==========================================================
// useVisualViewport - MOBILE KEYBOARD aur URL BAR ka ilaaj
//
// Mobile browser me do "viewport" hote hain, aur yahi saari dikkat ki jad hai:
//
//   LAYOUT viewport  = page ko jitni jagah mili hai (CSS isi ko naapta hai)
//   VISUAL viewport  = user ko is waqt jitna sach me DIKH raha hai
//
// Normally dono barabar hote hain. Keyboard khulte hi alag ho jate hain,
// aur do bade browser do ALAG tarike se alag hote hain:
//
//   Android Chrome -> layout viewport hi chhota kar deta hai
//                     (interactive-widget=resizes-content ki wajah se,
//                      dekho index.html). Yani window.innerHeight ghat jati hai
//
//   iOS Safari     -> layout viewport bilkul nahi badalta. Wo bas visual
//                     viewport ko chhota karke UPAR khiska deta hai.
//                     Isliye 100vh/100dvh dono jhooth bolte hain, aur
//                     position:fixed wala header screen se bahar chala jata hai
//
// Ek hi code se dono sambhal jayein, iske liye hum CSS ko teen naap dete hain:
//
//   --app-height      -> abhi sach me kitni jagah dikh rahi hai
//   --app-offset-top  -> visual viewport layout ke andar kitna neeche khisak gaya
//   --keyboard-inset  -> keyboard ne kitni jagah khayi
//
// Aur ek attribute: data-keyboard="open" / "closed"
//
// CSS in naapo ka istemal .app-shell me karta hai (dekho index.css)
// ==========================================================

// Keyboard maana jaye ya nahi - itne px se zyada jagah gayi tabhi.
// Itna bada isliye rakha hai kyunki Chrome ka URL bar aur neeche wala
// toolbar chhupne-dikhne par bhi height 100px tak badal jati hai. Us par
// "keyboard khul gaya" samajh lena galat hoga. Asli keyboard 250px+ ka hota hai
const KEYBOARD_THRESHOLD = 150

// Input jaisi cheez par focus hai ya nahi - keyboard ka baseline naapte
// waqt kaam aata hai (focus ke dauraan baseline update nahi karna chahiye)
const isEditableFocused = () => {
  const el = document.activeElement
  if (!el) return false

  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable === true
}

export const useVisualViewport = ({ lockDocument = true } = {}) => {
  const [keyboard, setKeyboard] = useState({ open: false, height: 0 })

  // Keyboard band hone par screen ki jitni height thi - usi se naapte hain
  // ki keyboard ne kitni jagah khayi. Ye state nahi ref hai kyunki isse
  // render karne ki koi zarurat nahi
  const baselineRef = useRef(0)

  // rAF me ek se zyada update queue na ho
  const frameRef = useRef(0)

  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport

    // ---- DOCUMENT LOCK ----
    // Chat page par poora document scroll nahi hona chahiye - sirf messages
    // wali list scroll hoti hai. Iske bina iOS keyboard khulte hi poora page
    // upar sarka deta hai aur header gayab ho jata hai
    if (lockDocument) root.classList.add('app-locked')

    const measure = () => {
      frameRef.current = 0

      // vv na ho (bahut purana browser) to layout viewport hi sach maan lo
      const height = vv?.height ?? window.innerHeight
      const offsetTop = vv?.offsetTop ?? 0

      // ---- BASELINE ----
      // Keyboard kitni jagah kha raha hai, ye tabhi pata chalta hai jab
      // hume maloom ho ki "khali screen" kitni badi thi
      //
      // Kisi input par focus NAHI hai -> keyboard ho hi nahi sakta, isliye
      // jo bhi height hai wahi normal hai. Seedha assign karte hain (max
      // nahi) - warna desktop par window chhoti karte hi purani badi
      // height baseline me atak jati aur app hamesha "keyboard khula hai"
      // samajhta rehta
      //
      // Focus HAI -> keyboard khul sakta hai, isliye baseline ko ghatne
      // nahi dete. Sirf badhne dete hain (URL bar chhupne par height
      // badhti hai, wo naya normal hai)
      if (isEditableFocused()) {
        baselineRef.current = Math.max(baselineRef.current, height)
      } else {
        baselineRef.current = height
      }

      const keyboardHeight = Math.max(0, Math.round(baselineRef.current - height))
      const open = keyboardHeight > KEYBOARD_THRESHOLD

      root.style.setProperty('--app-height', `${height}px`)
      root.style.setProperty('--app-offset-top', `${offsetTop}px`)
      root.style.setProperty('--keyboard-inset', `${open ? keyboardHeight : 0}px`)
      root.dataset.keyboard = open ? 'open' : 'closed'

      // State tabhi badalte hain jab sach me kuch badla ho - warna har
      // chhote se viewport event par poora chat page dobara render hoga
      setKeyboard((prev) =>
        prev.open === open && prev.height === keyboardHeight
          ? prev
          : { open, height: keyboardHeight }
      )
    }

    // Viewport events bahut tez aate hain (keyboard ki animation ke har
    // frame par). requestAnimationFrame se ek frame me ek hi baar naapte hain
    const schedule = () => {
      if (frameRef.current) return
      frameRef.current = requestAnimationFrame(measure)
    }

    // Screen ghumane par purana baseline bekaar ho jata hai - reset
    const resetBaseline = () => {
      baselineRef.current = 0
      schedule()
    }

    measure()

    // Saare listeners passive hain - ye sirf padhte hain, preventDefault
    // kabhi nahi karte. Passive batane se browser scroll ko rokta nahi
    const options = { passive: true }

    vv?.addEventListener('resize', schedule, options)
    vv?.addEventListener('scroll', schedule, options)
    window.addEventListener('resize', schedule, options)
    window.addEventListener('orientationchange', resetBaseline, options)

    // Focus hatte hi keyboard band hota hai, lekin kuch browser tab tak
    // koi resize event nahi bhejte. Isliye focus/blur par bhi naap lete hain
    window.addEventListener('focusin', schedule, options)
    window.addEventListener('focusout', schedule, options)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)

      vv?.removeEventListener('resize', schedule)
      vv?.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('orientationchange', resetBaseline)
      window.removeEventListener('focusin', schedule)
      window.removeEventListener('focusout', schedule)

      // Chat page chhodte waqt sab kuch waapas normal - warna landing
      // page scroll hi nahi hoga
      if (lockDocument) root.classList.remove('app-locked')
      root.style.removeProperty('--app-height')
      root.style.removeProperty('--app-offset-top')
      root.style.removeProperty('--keyboard-inset')
      delete root.dataset.keyboard
    }
  }, [lockDocument])

  return keyboard
}
