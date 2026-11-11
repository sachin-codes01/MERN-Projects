import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { ageFromDob, todayStr } from '../../utils/format.js'
import { onlyDigits, validatePersonal } from '../../utils/validators.js'

// Step 1: naam, DOB, mobile, address, email — har field ka error uske neeche dikhta hai
const PersonalStep = ({ form, update, onNext }) => {
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  // Field chhodte hi (blur) us field ko check karo — submit ka wait nahi
  const blur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }))
    setErrors(validatePersonal(form))
  }

  const change = (field, value) => {
    update({ [field]: value })
    setServerError('')
    if (touched[field]) setErrors(validatePersonal({ ...form, [field]: value }))
  }

  const fieldProps = (field) => ({
    value: form[field],
    onChange: (e) => change(field, e.target.value),
    onBlur: () => blur(field),
    error: Boolean(touched[field] && errors[field]),
    helperText: (touched[field] && errors[field]) || ' ',
  })

  const submit = async (e) => {
    e.preventDefault()
    const errs = validatePersonal(form)
    setErrors(errs)
    setTouched({ name: true, dob: true, mobile: true, address: true, email: true })
    if (Object.keys(errs).length) return

    setLoading(true)
    try {
      await onNext()
    } catch (err) {
      setServerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <h2 className="heading mb-4 text-2xl">Personal Information</h2>
      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}
      <div className="grid min-w-0 gap-x-4 [&>*]:min-w-0 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <TextField label="Full Name" required placeholder="Enter your full name" autoComplete="name" {...fieldProps('name')} />
        </div>
        <TextField
          label="Date of Birth"
          type="date"
          required
          {...fieldProps('dob')}
          helperText={(touched.dob && errors.dob) || (ageFromDob(form.dob) !== null ? `Age: ${ageFromDob(form.dob)} years` : 'Your age is calculated from your date of birth')}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayStr(), min: '1900-01-01' } }}
        />
        <TextField
          label="Mobile Number"
          required
          {...fieldProps('mobile')}
          onChange={(e) => change('mobile', onlyDigits(e.target.value))}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> },
            htmlInput: { inputMode: 'numeric', autoComplete: 'tel-national' },
          }}
        />
        <div className="sm:col-span-2">
          <TextField label="Address" required placeholder="House no., street, city" multiline minRows={2} autoComplete="street-address" {...fieldProps('address')} />
        </div>
        <div className="sm:col-span-2">
          <TextField label="Email (Optional)" type="email" placeholder="Enter email address" autoComplete="email" {...fieldProps('email')} />
        </div>
      </div>
      <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Next'}
      </Button>
    </form>
  )
}

export default PersonalStep
