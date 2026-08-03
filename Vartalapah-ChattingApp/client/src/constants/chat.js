// ==========================================================
// CHAT KE NAAP-TAUL
//
// Ye saare number pehle seedhe code ke beech me likhe the (setTimeout
// me 1500, if me 120, waghera). Us tarah do dikkatein hoti hain:
//   - padhne wale ko pata nahi chalta ki 1500 ka matlab kya hai
//   - ek hi cheez do jagah alag alag ho jati hai
//
// Har number ke saath uski WAJAH likhi hai - value badalni ho to
// pata rahe ki kya toot sakta hai
// ==========================================================

// ---------- TYPING INDICATOR ----------
// Itni der tak kuch na type kiya to saamne wale ko "stop typing" bhej dete hain.
// Bahut kam rakhne par indicator har do akshar par jhilmilata hai,
// bahut zyada rakhne par user type karna band kar chuka hota hai aur
// dusri taraf "typing..." dikhta rehta hai
export const TYPING_IDLE_MS = 1500

// ---------- SEARCH ----------
// Har akshar par API call na jaye. 400ms me aadmi agla akshar daba
// deta hai, isliye sirf rukne par hi request jati hai
export const SEARCH_DEBOUNCE_MS = 400

// ---------- SCROLL ----------
// Chat ke sabse neeche se itne px ke andar ho to naya message aane par
// apne aap neeche scroll kar dete hain. Isse zyada upar hai matlab user
// purani baatein padh raha hai - use beech me se uthana galat hoga
export const SCROLL_STICK_THRESHOLD_PX = 120

// Reply ke quote par tap karke original tak jaane ke baad wo itni der
// chamakta hai, taaki aankh use pakad le
export const MESSAGE_HIGHLIGHT_MS = 1500

// ---------- LONG PRESS ----------
// Ungli itni der dabaye rakho to message ka menu khulta hai.
// 300ms galti se trigger ho jata hai, 600ms atka hua lagta hai.
// WhatsApp/Instagram bhi isi aas paas hain
export const LONG_PRESS_MS = 450

// Ungli itne px se zyada khiskI to press cancel - matlab user
// scroll karna chahta hai, menu nahi kholna
export const LONG_PRESS_MOVE_TOLERANCE_PX = 10

// ---------- LAYOUT ----------
// Apple aur Google dono guidelines me 44px (44dp) minimum tap area hai.
// Isse chhota button ungli se theek se dabta nahi
export const MIN_TAP_TARGET_PX = 44

// Viewport itne px se zyada chhota hua tabhi "keyboard khul gaya" maante hain.
// Chrome ka URL bar aur bottom toolbar chhupne-dikhne par bhi height
// ~100px tak badal jati hai - us par keyboard samajh lena galat hoga.
// Asli mobile keyboard 250px+ ka hota hai
export const KEYBOARD_DETECT_THRESHOLD_PX = 150

// ---------- MESSAGES ----------
// Ek chat kholne par kitne purane messages aate hain (server par bhi yahi limit hai)
export const MESSAGE_PAGE_SIZE = 100

// Ek message me itne se zyada akshar nahi (server par bhi yahi check hai)
export const MAX_MESSAGE_LENGTH = 2000

// ---------- TOASTS ----------
export const TOAST_ERROR_MS = 4000
export const TOAST_SUCCESS_MS = 2500
