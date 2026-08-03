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

// MUI ki lakeer (Divider)
export const dividerSx = { borderColor: 'var(--color-app-border)' }
