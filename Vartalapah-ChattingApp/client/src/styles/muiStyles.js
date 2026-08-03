// ==========================================================
// MUI COMPONENTS KE COMMON STYLES
//
// Chat me kuch cheezein MUI ki hain (InputBase, Divider). Unke rang
// pehle seedhe hex me likhe the (#f1f5f9 text, #334155 divider) - wo
// sirf dark mode ke liye sahi the. Light mode me:
//   - input ka text aur placeholder safed par safed ho jata tha
//   - divider safed background par gehri kaali lakeer ban jata tha
//
// Ab dono theme ke variables se aate hain (dekho index.css ka @theme
// aur ThemeContext.jsx ka LIGHT_VARS), isliye theme badalte hi ye
// apne aap sahi ho jate hain
// ==========================================================

// Search box / message box ka text
// MUI placeholder ko default me opacity 0.42 deta hai - usse app-muted
// rang aur halka pad jata. Isliye opacity 1 karke rang khud de rahe hain
export const fieldSx = {
  color: 'var(--color-app-text)',
  // Teeno selector isliye: MUI apna placeholder rule input ki apni
  // class par lagata hai - .MuiInputBase-input wala selector uss se
  // bhari padta hai, isliye hamara rang hi lagta hai
  '& input::placeholder, & textarea::placeholder, & .MuiInputBase-input::placeholder': {
    color: 'var(--color-app-muted)',
    opacity: 1,
  },
}

// ==========================================================
// CHAT KA MESSAGE BOX
//
// Ye fieldSx se alag isliye hai kyunki yahan ek aur dikkat thi:
// placeholder aur type kiya hua text send button ke beech me nahi,
// thoda NEECHE dikh rahe the.
//
// Wajah: MUI InputBase apne root par `padding: 4px 0 5px` lagata hai.
// Ye padding upar-neeche BARABAR nahi hai (4 vs 5) - wo purane
// underline wale input ke liye bana hai. Upar se message box multiline
// hai aur uski row `items-end` par hai, isliye input neeche se chipakta
// hai - dono milkar text ko button ke center se ~6px neeche kar dete the.
//
// Ilaaj (jugaad nahi, seedhi baat):
//   minHeight 44  -> input utna hi lamba jitna send/attach button.
//                    Ek line wala text apne aap beech me aa jata hai
//   padding 10/10 -> upar-neeche barabar. Multiline me line badhne par
//                    box neeche se badhta hai aur button apni jagah rehta hai
// ==========================================================
export const composerFieldSx = {
  ...fieldSx,
  minHeight: 44,
  paddingTop: '10px',
  paddingBottom: '10px',
  paddingLeft: 0,
  paddingRight: 0,
}

// MUI ki lakeer (Divider)
export const dividerSx = { borderColor: 'var(--color-app-border)' }
