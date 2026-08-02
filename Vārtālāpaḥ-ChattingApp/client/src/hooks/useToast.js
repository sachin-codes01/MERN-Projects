import { useState } from 'react'

// ==========================================================
// useToast - neeche dikhne wale chhote message (Snackbar)
//
// Poore chat page me do hi tarah ke message dikhte hain:
//   error -> laal  ("Message cannot be empty")
//   info  -> hara  ("Group created")
//
// Har hook ko ye dono setter chahiye hote hain, isliye ek chhota
// hook bana diya. Isse "toast" ek hi cheez ki tarah pass hota hai
// ==========================================================
export const useToast = () => {
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  return { error, info, setError, setInfo }
}
