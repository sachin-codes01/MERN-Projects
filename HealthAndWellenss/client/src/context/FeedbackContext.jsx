import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Snackbar from '@mui/material/Snackbar'
import useMediaQuery from '@mui/material/useMediaQuery'

const FeedbackContext = createContext(null)

// Poori app ke liye 2 popups:
// 1) toast — chhota message (success/error) jo kuch second me gayab ho jaata hai
// 2) confirm — "Are you sure?" dialog, jo Promise<true/false> return karta hai
export const FeedbackProvider = ({ children }) => {
  const [toast, setToast] = useState(null)
  const [confirmState, setConfirmState] = useState(null)
  const isDesktop = useMediaQuery('(min-width:768px)')

  const notify = useMemo(() => {
    const show = (severity) => (message) => setToast({ message, severity, key: Date.now() })
    return { success: show('success'), error: show('error'), info: show('info'), warning: show('warning') }
  }, [])

  // const ok = await confirm({ title, message, confirmText, danger })
  const confirm = useCallback((options) => new Promise((resolve) => setConfirmState({ ...options, resolve })), [])

  const closeConfirm = (result) => {
    confirmState?.resolve(result)
    setConfirmState(null)
  }

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm])

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <Snackbar
        key={toast?.key}
        open={Boolean(toast)}
        autoHideDuration={toast?.severity === 'error' ? 6000 : 3500}
        onClose={(_, reason) => reason !== 'clickaway' && setToast(null)}
        anchorOrigin={isDesktop ? { vertical: 'top', horizontal: 'right' } : { vertical: 'top', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)} sx={{ width: '100%', alignItems: 'center' }}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>

      <Dialog open={Boolean(confirmState)} onClose={() => closeConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'primary.main' }}>
          {confirmState?.title || 'Are you sure?'}
        </DialogTitle>
        {confirmState?.message && <DialogContent className="text-muted">{confirmState.message}</DialogContent>}
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => closeConfirm(false)} color="inherit">
            {confirmState?.cancelText || 'Cancel'}
          </Button>
          <Button variant="contained" color={confirmState?.danger ? 'error' : 'primary'} onClick={() => closeConfirm(true)}>
            {confirmState?.confirmText || 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </FeedbackContext.Provider>
  )
}

export const useToast = () => useContext(FeedbackContext).notify
export const useConfirm = () => useContext(FeedbackContext).confirm
