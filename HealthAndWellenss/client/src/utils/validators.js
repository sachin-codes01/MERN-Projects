import { todayStr } from './format.js'

// Form validation — har function { fieldName: 'error message' } return karta hai (khaali = sab sahi)

export const MOBILE_REGEX = /^[6-9]\d{9}$/
const EMAIL_REGEX = /^\S+@\S+\.\S+$/
const NAME_REGEX = /^[a-zA-Z][a-zA-Z .'-]*$/

export const mobileError = (mobile) => {
  if (!mobile) return 'Mobile number is required'
  if (!/^\d+$/.test(mobile)) return 'Only digits are allowed'
  if (mobile.length !== 10) return 'Mobile number must be 10 digits'
  if (!MOBILE_REGEX.test(mobile)) return 'Enter a valid Indian mobile number'
  return ''
}

export const emailError = (email, required = false) => {
  if (!email) return required ? 'Email is required' : ''
  return EMAIL_REGEX.test(email) ? '' : 'Enter a valid email address'
}

export const nameError = (name) => {
  const n = name.trim()
  if (!n) return 'Full name is required'
  if (n.length < 2) return 'Name is too short'
  if (!NAME_REGEX.test(n)) return 'Name can only contain letters and spaces'
  return ''
}

export const dobError = (dob) => {
  if (!dob) return 'Date of birth is required'
  if (dob > todayStr()) return 'Date of birth cannot be in the future'
  if (dob < '1900-01-01') return 'Enter a valid date of birth'
  return ''
}

// Sirf jo errors hain unhe rakhta hai
const clean = (errors) => Object.fromEntries(Object.entries(errors).filter(([, v]) => v))

export const validatePersonal = (f) =>
  clean({
    name: nameError(f.name),
    dob: dobError(f.dob),
    mobile: mobileError(f.mobile),
    address: !f.address.trim() ? 'Address is required' : f.address.trim().length < 5 ? 'Please enter your full address' : '',
    email: emailError(f.email),
  })

export const validateWellness = (f) =>
  clean({
    concern: !f.concern ? 'Please select your main concern' : '',
    bodyArea: !f.bodyArea ? 'Please select the affected body area' : '',
  })

// Mobile input me sirf 10 digits
export const onlyDigits = (value, max = 10) => value.replace(/\D/g, '').slice(0, max)
