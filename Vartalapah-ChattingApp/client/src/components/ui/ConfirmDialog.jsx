import {
  Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
} from '@mui/material'
import { useBackGuard } from '@/hooks/ui/useBackGuard.js'

// ==========================================================
// CONFIRM DIALOG
//
// Jo kaam wapas nahi ho sakta (unsend, delete group, delete account)
// uske pehle hamesha yahi dabba aata hai.
//
// Ye components/ui/ me hai (chat/ me nahi) kyunki iska chat se koi
// lena dena nahi - ye kisi bhi feature me kaam aa sakta hai
//
// `confirm` object aisa hota hai:
//   { title, text, confirmLabel, onYes }
// null ho to dialog band rehta hai. Isi ek state se poore app ke
// saare confirm chalte hain - har jagah apna alag state nahi banana padta
// ==========================================================
const ConfirmDialog = ({ confirm, onCancel, onConfirm }) => {
  const isOpen = !!confirm

  useBackGuard(isOpen, onCancel)

  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <DialogTitle>{confirm?.title}</DialogTitle>

      <DialogContent>
        <DialogContentText>{confirm?.text}</DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} sx={{ minHeight: 44 }}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm} sx={{ minHeight: 44 }}>
          {confirm?.confirmLabel || 'Yes, continue'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDialog
