import { useMemo } from 'react'

// ==========================================================
// PASSWORD RULES
//
// Backend ke utils/validatePassword.js jaisi hi shartein - Signup,
// CreatePassword aur ForgotPassword teeno yahi ek list use karte hain,
// taaki "8 characters" wala niyam kabhi ek jagah 8 aur doosri jagah
// 6 na ho jaye
// ==========================================================
export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'One number', test: (v) => /[0-9]/.test(v) },
  { key: 'special', label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

// Password change hote hi, har niyam ke saamne "pass hua ya nahi" (ok: true/false) jod deta hai
export const usePasswordRules = (password) =>
  useMemo(() => PASSWORD_RULES.map((rule) => ({ ...rule, ok: rule.test(password) })), [password])
