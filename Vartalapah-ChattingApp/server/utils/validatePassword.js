// ==========================================================
// PASSWORD RULES
//
// Google-only accounts pehli baar app password banate hain - yahan
// wahi niyam check hote hain: /auth/set-password isse use karta hai.
//
// Ek hi jagah rakha hai taaki frontend ka message aur backend ka
// asli check kabhi ek dusre se alag na ho jayein
// ==========================================================
const PASSWORD_MIN_LENGTH = 8

const PASSWORD_REQUIREMENTS_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a special character'

const validatePassword = (password) => {
  if (typeof password !== 'string') return false
  if (password.length < PASSWORD_MIN_LENGTH) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[a-z]/.test(password)) return false
  if (!/[0-9]/.test(password)) return false
  if (!/[^A-Za-z0-9]/.test(password)) return false
  return true
}

module.exports = { validatePassword, PASSWORD_MIN_LENGTH, PASSWORD_REQUIREMENTS_MESSAGE }
