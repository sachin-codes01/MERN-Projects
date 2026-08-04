import { useEffect, useRef } from 'react'

// ==========================================================
// useBackGuard - ANDROID KA BACK BUTTON
//
// Dikkat: chat khuli ho aur Android ka back dabaya jaye to browser
// seedha website hi band kar deta hai. Asli app me back sirf ek kadam
// peeche jata hai:
//
//     Chats  ->  Conversation  --back-->  Chats  --back-->  website band
//
// Ilaaj: jab bhi koi cheez "khulti" hai (chat, sheet, dialog, viewer),
// hum history me ek nakli entry daal dete hain. Back dabane par browser
// usi nakli entry ko hatata hai, website band nahi hoti - aur hum
// popstate sunkar us cheez ko band kar dete hain.
//
// ---- DEPTH-RECONCILE DESIGN ----
// Purana code har guard ko apna push/back khud chalane deta tha. Us se
// ek real bug tha: "Unsend" dabane par EK hi click me ActionSheet band
// (jo khud history.back() chalata - ASYNC) aur ConfirmDialog khulta
// (jo khud pushState() chalata - SYNC) hota tha. back() ka result
// baad me aata hai, isliye pushState purani (abhi tak na hati) entry
// ke UPAR chadh jata - history stack tut jata, aur Unsend/back dono
// kabhi kabhi kuch nahi karte (isi wajah se image viewer se back karne
// par kabhi kabhi Profile tab khul jata tha - dono ek hi root cause).
//
// Naya tarika: kaun sa layer khula/band hua uska hisaab EK JS array me
// rakhte hain (activeLayers). History ko chhedte nahi turant - ek
// microtask tak ruk kar sirf AAKHRI (net) girti-chadhti depth ke
// hisaab se ek hi baar history badalte hain. Isliye upar wala example
// me ActionSheet hatna aur ConfirmDialog aana - dono milakar depth
// 1 -> 1 hi rehti hai, to history ko haath hi nahi lagta. Koi race nahi
// ==========================================================

// Poori app ke saare khule "layers" (sheet/dialog/viewer/chat) - jis
// order me khule usi order me hain
let activeLayers = []
let nextId = 0
let reconcileScheduled = false

// history.pushState/go turant nahi, ek microtask baad chalate hain -
// taaki ek hi React commit ke andar ke saare open/close (band + khulna
// ek saath) pehle activeLayers me jud/hat jayein, aur history sirf
// AAKHRI (net) result dekhe
const scheduleReconcile = () => {
  if (reconcileScheduled) return
  reconcileScheduled = true

  queueMicrotask(() => {
    reconcileScheduled = false
    reconcile()
  })
}

const reconcile = () => {
  const desired = activeLayers.length
  const current = window.history.state?.__navDepth || 0

  if (desired === current) return // net me kuch nahi badla - history ko chhuo hi mat

  if (desired > current) {
    // Har naye level ki apni entry - taaki back button EK-EK karke
    // band kare, sabko ek saath nahi
    for (let depth = current + 1; depth <= desired; depth++) {
      window.history.pushState({ ...window.history.state, __navDepth: depth }, '')
    }
  } else {
    // UI se (button/backdrop) band hua hai - utni hi entries wapas
    window.history.go(desired - current)
  }
}

// Hardware/browser ka BACK - poori app me EK hi listener, kisi ek
// guard ka nahi. history.state already browser ne update kar diya
// hota hai jab tak ye event chalta hai, isliye "asli depth" wahi se milti hai
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const realDepth = window.history.state?.__navDepth || 0

    // Jitni layers zyada khuli hain asli depth se, sabse UPAR wali
    // (sabse baad me khuli) ko band karte jao - LIFO
    while (activeLayers.length > realDepth) {
      const top = activeLayers[activeLayers.length - 1]
      activeLayers = activeLayers.slice(0, -1)
      top.onBackRef.current?.()
    }
  })
}

// ==========================================================
// active  -> cheez khuli hai ya nahi
// onBack  -> back dabane par use band karne wala function
// ==========================================================
export const useBackGuard = (active, onBack) => {
  const onBackRef = useRef(onBack)
  onBackRef.current = onBack

  useEffect(() => {
    if (!active) return

    const layer = { id: ++nextId, onBackRef }
    activeLayers = [...activeLayers, layer]
    scheduleReconcile()

    return () => {
      // Back button se pehle hi hat chuki ho sakti hai (popstate
      // listener ne upar hata di) - filter tab bhi safe hai
      activeLayers = activeLayers.filter((l) => l.id !== layer.id)
      scheduleReconcile()
    }
  }, [active])
}
