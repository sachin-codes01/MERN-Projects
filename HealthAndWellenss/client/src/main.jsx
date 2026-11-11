import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import App from './App.jsx'
import theme from './theme.js'
import { AuthProvider } from './context/AuthContext.jsx'
import { FeedbackProvider } from './context/FeedbackContext.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'
import './index.css'

// Providers ka order: MUI theme → toast/confirm popups → settings → login → routing
// enableCssLayer: MUI styles "mui" layer me jaate hain taaki Tailwind classes unhe override kar sakein
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FeedbackProvider>
          <SettingsProvider>
            <AuthProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </AuthProvider>
          </SettingsProvider>
        </FeedbackProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </StrictMode>,
)
