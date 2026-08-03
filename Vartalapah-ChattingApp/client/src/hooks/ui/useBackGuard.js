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
// Isse Chats page par back apne aap website band kar dega, kyunki wahan
// koi nakli entry hai hi nahi. Bilkul wahi behaviour jo maanga gaya tha.
//
// ---- Ek peech jise samajhna zaroori hai ----
// Cheez do tarah se band ho sakti hai:
//   (a) BACK dabane se     -> entry pehle hi hat chuki hai, kuch mat karo
//   (b) Button/backdrop se -> entry abhi history me padi hai, use hatao
//
// (b) me hum khud history.back() chalate hain. Us se ek popstate event
// aata hai jo BAAHAR wale guard (jaise khuli hui chat) ko galti se band
// kar deta. Isliye ek chhota sa "suppress" flag rakha hai jo sirf usi
// ek event ke liye sab guards ko chup kara deta hai
// ==========================================================

// Poori app me ek hi - isliye module level par hai, kisi component me nahi
let suppressNextPop = false

// Har guard ki apni pehchaan, taaki wo bata sake ki history me sabse upar
// uski hi entry hai ya nahi
let guardSeq = 0

// Apni daali hui entry hatana - lekin is se aane wale popstate ko
// baaki guards tak nahi pahunchne dena
const popOwnEntry = () => {
  suppressNextPop = true

  // Ye listener SABSE AAKHIR me juda hai, isliye usi popstate par baaki
  // saare handlers ke BAAD chalta hai - tab tak flag apna kaam kar chuka
  // hota hai. Phir khud ko hata deta hai
  const release = () => {
    suppressNextPop = false
    window.removeEventListener('popstate', release)
    clearTimeout(failsafe)
  }

  // Agar history me peeche jaane ko kuch bacha hi nahi (browser kuch nahi
  // karta, popstate aata hi nahi) to flag hamesha ke liye atak jata.
  // Ye timer usse bachata hai
  const failsafe = setTimeout(release, 400)

  window.addEventListener('popstate', release)
  window.history.back()
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

    const id = ++guardSeq

    // Nakli entry. URL bilkul wahi rehta hai (teesra argument nahi diya) -
    // sirf history stack me ek kadam judta hai
    window.history.pushState({ ...window.history.state, __guard: id }, '')

    const handlePop = () => {
      if (suppressNextPop) return
      onBackRef.current?.()
    }

    window.addEventListener('popstate', handlePop)

    return () => {
      window.removeEventListener('popstate', handlePop)

      // Sabse upar meri hi entry hai? Matlab cheez back se nahi, kisi
      // button/backdrop se band hui - to apni entry khud hatani padegi.
      // Warna user ko ek "khaali" back dabana padta (kuch hota hi nahi)
      if (window.history.state?.__guard === id) popOwnEntry()
    }
  }, [active])
}
