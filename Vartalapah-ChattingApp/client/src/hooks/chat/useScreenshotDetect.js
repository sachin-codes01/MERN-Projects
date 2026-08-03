import { useEffect, useRef, useState } from 'react'

// ==========================================================
// useScreenshotDetect - "Sachin took a screenshot."
//
// PEHLE SACH JAAN LO (ye code ka sabse zaroori comment hai):
//
// Browser me screenshot detect karne ka KOI API NAHI HAI. Na Chrome me,
// na Safari me, na Firefox me. Jaan-boojhkar nahi hai - agar hota to har
// website ko pata chal jata ki aapne kab kya screenshot liya.
//
// Internet par jo "jugaad" milte hain (page blur ho gaya, visibility
// badli, ya screen ek pal ke liye chamki) wo SAB galat alarm dete hain:
// notification aane par, app switch karne par, call aane par bhi trigger
// ho jate hain. Kisi par jhootha ilzaam ("aapne screenshot liya") lagana
// kuch na dikhane se KHARAB hai. Isliye wo jugaad yahan nahi hain.
//
// To phir ye hook karta kya hai? Do jagah se ASLI signal leta hai:
//
//   1. NATIVE WRAPPER (Capacitor / Cordova / React Native WebView)
//      Android aur iOS dono OS level par screenshot ka event dete hain.
//      App ko wrapper me daalo to wahi event yahan pahunch jata hai.
//      Neeche NATIVE_BRIDGE me teeno tarike sun rahe hain, aur ek
//      universal DOM event bhi - koi bhi wrapper bas ye chala de:
//
//          window.dispatchEvent(new Event('vartalapah:screenshot'))
//
//   2. DESKTOP KEYBOARD
//      Ye sach me pakda ja sakta hai: Windows/Linux ka PrintScreen aur
//      macOS ka Cmd+Shift+3/4/5 keyboard event page tak pahunchta hai
//
// Baaki jagah (normal mobile browser) hook chup rehta hai. `supported`
// false aata hai, taaki UI chahe to user ko saaf saaf bata sake
// ==========================================================

// Wrapper se aane wala universal event. Kisi bhi native shell me bas
// itna likhna hota hai - koi plugin-specific code app me nahi aata
const BRIDGE_EVENT = 'vartalapah:screenshot'

// macOS ke screenshot shortcuts: Cmd+Shift+ 3 (poori screen),
// 4 (chuna hua hissa), 5 (screenshot toolbar)
const MAC_SHORTCUT_KEYS = ['3', '4', '5']

// Ek hi screenshot par kabhi kabhi do event aa jate hain (keydown+keyup,
// ya wrapper ka apna double fire). Itne ms ke andar dusra ignore
const DEDUPE_MS = 1500

// ==========================================================
// NATIVE BRIDGE
// Alag alag wrapper alag naam se plugin dete hain. Jo mil jaye usi se
// jud jate hain, aur cleanup ka function wapas karte hain
// ==========================================================
const connectNativeBridge = (fire) => {
  const cleanups = []

  // ---- 1. Universal DOM event (sabse behtar - app ko plugin ka naam
  //         jaanne ki zarurat hi nahi) ----
  window.addEventListener(BRIDGE_EVENT, fire)
  cleanups.push(() => window.removeEventListener(BRIDGE_EVENT, fire))

  // ---- 2. Capacitor ----
  // Plugin ka naam project ke hisaab se badal sakta hai, isliye jo bhi
  // "ScreenshotDetect"-jaisa plugin mila usse jud jate hain
  const capacitor = window.Capacitor
  const capPlugin =
    capacitor?.Plugins?.ScreenshotDetect || capacitor?.Plugins?.ScreenshotDetector

  if (capPlugin?.addListener) {
    // Capacitor listener ek Promise deta hai jiske andar remove() hota hai
    const handle = capPlugin.addListener('screenshotTaken', fire)
    cleanups.push(() => {
      Promise.resolve(handle)
        .then((h) => h?.remove?.())
        .catch(() => {})
    })

    capPlugin.start?.()
  }

  // ---- 3. Cordova ----
  // Cordova plugin document par apna event bhejta hai
  if (window.cordova) {
    document.addEventListener('screenshotTaken', fire)
    cleanups.push(() => document.removeEventListener('screenshotTaken', fire))
  }

  return () => cleanups.forEach((fn) => fn())
}

// Native wrapper ke andar chal rahe hain ya normal browser me
const hasNativeShell = () =>
  typeof window !== 'undefined' &&
  !!(window.Capacitor?.isNativePlatform?.() || window.cordova || window.ReactNativeWebView)

// Keyboard wala rasta sirf mouse/keyboard wale device par kaam ka hai
const hasPhysicalKeyboard = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(pointer: fine)').matches === true

// ==========================================================
// enabled      -> sirf khuli hui chat me sunna hai, har jagah nahi
// onScreenshot -> screenshot pakda gaya
// ==========================================================
export const useScreenshotDetect = ({ enabled, onScreenshot }) => {
  // UI ko bata sakein ki is device par detection sach me kaam karti hai
  const [supported] = useState(() => hasNativeShell() || hasPhysicalKeyboard())

  const callbackRef = useRef(onScreenshot)
  callbackRef.current = onScreenshot

  const lastFiredRef = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const fire = () => {
      const now = Date.now()
      if (now - lastFiredRef.current < DEDUPE_MS) return

      lastFiredRef.current = now
      callbackRef.current?.()
    }

    const cleanupBridge = connectNativeBridge(fire)

    // ---- DESKTOP KEYBOARD ----
    // PrintScreen keydown me nahi, sirf keyup me aata hai (Windows OS
    // keydown khud kha jata hai). macOS wala keydown me aata hai
    const onKeyUp = (e) => {
      if (e.key === 'PrintScreen') fire()
    }

    const onKeyDown = (e) => {
      if (e.metaKey && e.shiftKey && MAC_SHORTCUT_KEYS.includes(e.key)) fire()
    }

    // Passive: hum screenshot rok nahi rahe (rok bhi nahi sakte),
    // sirf jaan rahe hain ki hua hai
    window.addEventListener('keyup', onKeyUp, { passive: true })
    window.addEventListener('keydown', onKeyDown, { passive: true })

    return () => {
      cleanupBridge()
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [enabled])

  return { supported }
}
