import { useTheme } from '@mui/material/styles'

const LOGO_IMAGES = {
  light: '/images/logo-transparent.png',
  dark: '/images/logo-transparent.png',
}
const SIZES = { sm: 'h-24 w-24', md: 'h-40 w-40', lg: 'h-56 w-56 sm:h-64 sm:w-64' }

// Each supplied asset already includes the full wordmark; do not duplicate it in text.
const Logo = ({ size = 'sm', stacked = false, variant, className = '' }) => {
  const theme = useTheme()
  const mode = variant || theme.palette.mode || 'light'
  return <div className={`flex shrink-0 ${stacked ? 'justify-center' : 'items-center'} ${className}`}>
    <img src={LOGO_IMAGES[mode] || LOGO_IMAGES.light} alt="Shree Radhey Shyam Health and Wellness Centre" width="500" height="500" className={`${SIZES[size] || SIZES.sm} object-contain ${mode === 'dark' ? 'brand-logo-on-dark' : ''}`} />
  </div>
}
export default Logo
