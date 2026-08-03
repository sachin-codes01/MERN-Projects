import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '@/context/AuthContext.jsx'
import { SocketProvider } from '@/context/SocketContext.jsx'
import { ThemeModeProvider, useThemeMode } from '@/context/ThemeContext.jsx'
import AppRoutes from '@/routes/AppRoutes.jsx'
import '@/styles/index.css'

// MUI ka theme ThemeContext ke "mode" ke hisaab se badalta hai - taki
// dialogs/inputs/menus bhi Tailwind wale light/dark ke saath match karein
const MuiThemeBridge = ({ children }) => {
  const { mode } = useThemeMode()

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#8b5cf6' },   // violet - main accent
          secondary: { main: '#818cf8' }, // indigo
          background:
            mode === 'dark'
              ? { default: '#0f172a', paper: '#1e293b' }
              : { default: '#ffffff', paper: '#f8fafc' },
        },
        shape: { borderRadius: 12 },
        typography: {
          // MUI apne components (dialog, button, input) me apna font lagata hai
          // Isliye yahan bhi wahi system font set kiya hai jo body me hai
          fontFamily: 'system-ui, "Segoe UI", Roboto, Arial, sans-serif',
          button: { textTransform: 'none', fontWeight: 600 },
        },
      }),
    [mode]
  )

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

// Google ka Client ID .env file se aata hai (VITE_ se shuru hone wali variables hi frontend me milti hain)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Providers ka order:
// GoogleOAuthProvider -> Google login button ke liye
// BrowserRouter       -> routing
// ThemeModeProvider   -> light/dark mode ka choice (localStorage me save)
// MuiThemeBridge      -> usi choice se MUI ka theme banata hai
// AuthProvider        -> logged-in user ki information poori app me share karne ke liye
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ThemeModeProvider>
          <MuiThemeBridge>
            {/* SocketProvider AuthProvider ke ANDAR hai
                kyunki socket ko pata hona chahiye ki user logged in hai ya nahi */}
            <AuthProvider>
              <SocketProvider>
                <AppRoutes />
              </SocketProvider>
            </AuthProvider>
          </MuiThemeBridge>
        </ThemeModeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
)
