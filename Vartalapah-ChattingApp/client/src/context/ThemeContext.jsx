import { createContext, useContext, useState, useEffect } from 'react'

// ==========================================================
// THEME CONTEXT
// Light/dark mode ka choice yahan store hota hai.
// localStorage me save karte hain isliye refresh ke baad bhi
// wahi mode yaad rehta hai. Kuch save na ho to "dark" default hai
// ==========================================================
const STORAGE_KEY = 'instachats_theme'

// Light mode ke rang - dark wale index.css ke @theme block me hain
// (yahin se seedha inline style par lagate hain, isliye Tailwind ke
// CSS layers se koi takraav nahi hota - inline style hamesha jeetta hai)
//
// DHYAN: yahi list index.html me bhi hai (React load hone se pehle
// wala chhota script, taaki light wale user ko dark ka flash na dikhe).
// Koi rang badlo to dono jagah badalna
const LIGHT_VARS = {
  '--color-app-bg': '#ffffff',
  '--color-app-panel': '#f8fafc',
  '--color-app-hover': '#f1f5f9',
  // #e2e8f0 tha, lekin safed background par wo lakeer dikhti hi nahi thi.
  // #cbd5e1 par light mode ka border utna hi gehra lagta hai jitna dark
  // mode me #334155 apne background par (dono ka contrast ~1.49)
  '--color-app-border': '#cbd5e1',
  '--color-app-text': '#0f172a',
  '--color-app-muted': '#64748b',
  '--color-app-bubble': '#e2e8f0',

  // Bade sajawati number. Dark me ye app-panel jitna halka hai, lekin
  // light mode me app-panel safed ke barabar hai - us rang me number
  // bilkul gayab ho jate the, isliye yahan thoda gehra slate rakha hai
  '--color-app-ghost': '#cbd5e1',
}

const ThemeContext = createContext(null)

export const useThemeMode = () => useContext(ThemeContext)

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' ? 'light' : 'dark'
  })

  // Mode badalte hi <html> par inline se hi rang variables laga dete hain.
  // Pehle CSS ke "[data-theme] { }" selector se try kiya tha, lekin Tailwind
  // ke @theme block wale hi layer ke andar hote hain aur cascade order ka
  // jhamela ho raha tha - inline style seedha jeet jaata hai, koi confusion nahi
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode)
    document.documentElement.setAttribute('data-theme', mode)

    const root = document.documentElement.style
    Object.entries(LIGHT_VARS).forEach(([key, value]) => {
      if (mode === 'light') root.setProperty(key, value)
      else root.removeProperty(key)
    })

    // Mobile browser ka address-bar color bhi theme ke saath badal do
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) metaTheme.setAttribute('content', mode === 'light' ? '#ffffff' : '#0f172a')
  }, [mode])

  const toggleMode = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
