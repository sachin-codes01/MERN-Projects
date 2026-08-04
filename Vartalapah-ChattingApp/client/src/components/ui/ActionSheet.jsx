import { Drawer, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material'
import { useIsTouch } from '@/hooks/ui/useMediaQuery.js'
import { useBackGuard } from '@/hooks/ui/useBackGuard.js'
import { DANGER, BRAND } from '@/constants/theme.js'

// ==========================================================
// ACTION SHEET
//
// Ek hi component, do shakal - poore app me actions ki list dikhane ka
// yahi ek rasta hai:
//
//   TOUCH DEVICE -> neeche se uthta hua bottom sheet (WhatsApp/Instagram
//                   jaisa). Ungli ke paas, bade rows, safe area ka khyaal
//   MOUSE DEVICE -> jahan click kiya wahin chhota sa menu (desktop jaisa)
//
// Do alag component banane se dono ki action list dheere dheere alag ho
// jati hai (ek me "Forward" reh jata hai, dusre me nahi). Isliye jaan
// boojhkar ek hi component hai - items dono jagah wahi ke wahi
//
// Android ka back button sheet ko band karta hai, website ko nahi -
// useBackGuard iska poora hisaab rakhta hai
// ==========================================================

// items ka format:
//   { key, label, icon, onClick, danger?, subtitle?, divider? }
// `divider: true` wali entry sirf ek lakeer hai - uska koi label nahi

const ActionSheet = ({ open, onClose, items, anchorPosition, title, ariaLabel = 'Actions' }) => {
  const isTouch = useIsTouch()

  // Back dabao -> sheet band, website khuli rahe
  useBackGuard(open, onClose)

  const visibleItems = items.filter(Boolean)

  const renderItem = (item, index) => {
    if (item.divider) return <Divider key={item.key || `divider-${index}`} sx={{ my: 0.5 }} />

    const tint = item.danger ? DANGER : BRAND.main

    return (
      <MenuItem
        key={item.key}
        onClick={() => {
          // Pehle sheet band, phir kaam - warna dialog/viewer khulne aur
          // sheet band hone ki animation ek saath chalti hain aur jhilmilata hai
          onClose()
          item.onClick()
        }}
        sx={{
          // 44px minimum touch target. Mobile par thoda aur khula rakha hai
          minHeight: isTouch ? 56 : 42,
          gap: 1,
          mx: isTouch ? 1 : 0,
          borderRadius: isTouch ? 2.5 : 1.5,
          color: item.danger ? 'error.main' : 'inherit',
          transition: 'background-color 0.15s ease',
        }}
      >
        {/* Icon ka apna tinted gol background - danger red, baaki brand violet */}
        <ListItemIcon
          sx={{
            color: tint,
            minWidth: 38,
            width: 38,
            height: 38,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${tint}1f`,
          }}
        >
          {item.icon}
        </ListItemIcon>

        <ListItemText
          primary={item.label}
          secondary={item.subtitle}
          slotProps={{
            primary: { fontSize: isTouch ? 15 : 14, fontWeight: 500 },
            secondary: { fontSize: 12 },
          }}
        />
      </MenuItem>
    )
  }

  // ---------- MOBILE: BOTTOM SHEET ----------
  if (isTouch) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        transitionDuration={{ enter: 260, exit: 200 }}
        // Sheet ke andar focus rehna chahiye (screen reader + keyboard)
        slotProps={{
          paper: {
            role: 'menu',
            'aria-label': ariaLabel,
            sx: {
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              // Gesture bar / home indicator ke upar hi rukna hai
              pb: 'calc(var(--safe-bottom) + 8px)',
              // Bahut lambi list par sheet poori screen na khaye
              maxHeight: '80vh',
              backgroundImage: 'none',
            },
          },
          // Peeche ka background blur - background me kya hai wo dhundhla
          // dikhta hai, dhyan poora sheet par chala jata hai
          backdrop: {
            sx: {
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0,0,0,0.45)',
            },
          },
        }}
      >
        {/* Neeche kheenchkar band karne ka ishara */}
        <div className="sheet-handle" aria-hidden="true" />

        {title && (
          <p className="px-5 pt-1 pb-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
            {title}
          </p>
        )}

        <div className="pb-1">{visibleItems.map(renderItem)}</div>
      </Drawer>
    )
  }

  // ---------- DESKTOP: MENU ----------
  // anchorPosition mila to wahin (right click wali jagah), warna beech me
  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference={anchorPosition ? 'anchorPosition' : 'none'}
      anchorPosition={anchorPosition ? { top: anchorPosition.y, left: anchorPosition.x } : undefined}
      slotProps={{
        list: { 'aria-label': ariaLabel, dense: true },
        // Menu beech me na aa jaye jab anchor na ho
        paper: anchorPosition ? undefined : { sx: { top: '50%', left: '50%' } },
      }}
    >
      {visibleItems.map(renderItem)}
    </Menu>
  )
}

export default ActionSheet
