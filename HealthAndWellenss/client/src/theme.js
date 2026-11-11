import { createTheme } from '@mui/material/styles'

// MUI ka theme — buttons, inputs, dialogs sab isi se style hote hain (colours index.css jaise hi)
const theme = createTheme({
  palette: {
    primary: { main: '#1f5135', light: '#2f6b47', dark: '#143522', contrastText: '#ffffff' },
    secondary: { main: '#b08a3e', light: '#dcc28a', dark: '#8a6a2b', contrastText: '#ffffff' },
    background: { default: '#faf7f0', paper: '#ffffff' },
    text: { primary: '#1f2a24', secondary: '#66706a' },
    success: { main: '#2e7d4f' },
    divider: '#e2ece0',
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif",
    h1: { fontFamily: "'Scaver', Georgia, serif", fontWeight: 600 },
    h2: { fontFamily: "'Scaver', Georgia, serif", fontWeight: 600 },
    h3: { fontFamily: "'Scaver', Georgia, serif", fontWeight: 600 },
    h4: { fontFamily: "'Scaver', Georgia, serif", fontWeight: 600 },
    h5: { fontFamily: "'Scaver', Georgia, serif", fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 3, paddingInline: 24, minHeight: 44, transition: 'background-color 160ms ease, border-color 160ms ease' }, sizeLarge: { paddingBlock: 11 } },
    },
    MuiTextField: { defaultProps: { fullWidth: true, size: 'medium' } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: '#ffffff' } } },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 6 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 8 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
})

export default theme
