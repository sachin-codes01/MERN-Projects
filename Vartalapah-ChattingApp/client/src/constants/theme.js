// ==========================================================
// BRAND COLORS
//
// Tailwind wale hisse ke rang index.css ke @theme block se aate hain
// (bg-brand, text-brand-light waghera). Lekin MUI ke components apna
// rang `sx` prop se lete hain - wahan Tailwind ki class nahi chalti.
//
// Isliye wahi rang yahan JS constants ki tarah bhi rakhe hain.
// Pehle har MUI component me '#7c3aed' seedha likha hota tha - 11
// jagah. Brand ka rang badalna ho to 11 jagah dhoondhna padta,
// aur ek bhi chhoot jaye to UI aadha purana aadha naya dikhta
//
// DHYAN: koi naya rang jodo to index.css ke @theme me bhi jodna
// (aur ThemeContext.jsx ke LIGHT_VARS me, agar light mode me alag ho)
// ==========================================================
export const BRAND = {
  main: '#8b5cf6',   // violet - main accent
  dark: '#7c3aed',   // gehra shade - avatar background, gradient ka start
  light: '#a855f7',  // halka shade - gradient ka end
  hover: '#6d28d9',  // button hover
}

// Khatre wale actions (delete, unsend, remove) ka laal
export const DANGER = '#f87171'

// Mera message bubble aur send button - dono par yahi gradient
export const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND.dark}, ${BRAND.light})`
export const BRAND_GRADIENT_HOVER = `linear-gradient(135deg, ${BRAND.hover}, #9333ea)`
