import { useState } from 'react'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { BODY_AREAS, CONCERNS } from '../../config.js'
import { validateWellness } from '../../utils/validators.js'

const MAX = 500

// Step 2: health concern — therapist ko pehle se pata ho ki kya problem hai
const WellnessStep = ({ form, update, onBack, onNext }) => {
  const [errors, setErrors] = useState({})

  const submit = (e) => {
    e.preventDefault()
    const errs = validateWellness(form)
    setErrors(errs)
    if (!Object.keys(errs).length) onNext()
  }

  const change = (field) => (e) => {
    update({ [field]: e.target.value })
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }))
  }

  return (
    <form onSubmit={submit} noValidate>
      <h2 className="heading mb-4 text-2xl">Wellness Information</h2>
      <div className="flex flex-col">
        <TextField select label="What is your main concern?" required value={form.concern} onChange={change('concern')} error={Boolean(errors.concern)} helperText={errors.concern || ' '}>
          {CONCERNS.map((c) => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>
        <TextField select label="Which body area is affected?" required value={form.bodyArea} onChange={change('bodyArea')} error={Boolean(errors.bodyArea)} helperText={errors.bodyArea || ' '}>
          {BODY_AREAS.map((a) => (
            <MenuItem key={a} value={a}>{a}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Additional details (Optional)"
          placeholder="Describe your concern..."
          multiline
          minRows={3}
          value={form.details}
          onChange={(e) => update({ details: e.target.value.slice(0, MAX) })}
          helperText={`${form.details.length}/${MAX}`}
          slotProps={{ formHelperText: { sx: { textAlign: 'right' } } }}
        />
        <TextField
          label="Any relevant history (Optional)"
          placeholder="E.g. previous treatments, injuries, surgeries"
          multiline
          minRows={2}
          value={form.history}
          onChange={(e) => update({ history: e.target.value.slice(0, MAX) })}
          helperText={`${form.history.length}/${MAX}`}
          slotProps={{ formHelperText: { sx: { textAlign: 'right' } } }}
          sx={{ mt: 1 }}
        />
      </div>
      <div className="mt-4 flex gap-3">
        <Button variant="outlined" size="large" onClick={onBack} sx={{ flex: 1 }}>
          Back
        </Button>
        <Button type="submit" variant="contained" size="large" sx={{ flex: 2 }}>
          Next
        </Button>
      </div>
    </form>
  )
}

export default WellnessStep
