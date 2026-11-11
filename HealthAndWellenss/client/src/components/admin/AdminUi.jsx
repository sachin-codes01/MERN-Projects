import { useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import { staffApi } from '../../api/index.js'
import { useDebounced, useFetch } from '../../hooks/useFetch.js'

// Admin panel ke chhote reusable pieces


// Dashboard ka number card
export const StatCard = ({ icon, label, value, hint, tone = 'brand' }) => {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    gold: 'bg-gold-100 text-gold-700',
    blue: 'bg-sky-50 text-sky-700',
    rose: 'bg-rose-50 text-rose-700',
  }
  return (
    <div className="surface flex items-center gap-4 p-4 sm:p-5">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted">{label}</p>
        <p className="text-2xl font-semibold leading-tight text-ink">{value}</p>
        {hint && <p className="truncate text-[11px] text-muted">{hint}</p>}
      </div>
    </div>
  )
}

// Section card with title + right action
export const Panel = ({ title, action, children, className = '' }) => (
  <section className={`surface p-4 sm:p-5 ${className}`}>
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        {title && <h2 className="font-serif text-2xl font-semibold text-brand-700">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
)

// Customer dhoondhne wala dropdown (naam / mobile / ID se, type karte hi search)
export const CustomerPicker = ({ value, onChange, error, helperText, disabled }) => {
  const [input, setInput] = useState('')
  const query = useDebounced(input.trim())
  const { data, loading } = useFetch(
    () => (query.length >= 2 ? staffApi.customers({ search: query, limit: 10 }) : Promise.resolve({ data: { items: [] } })),
    [query],
  )
  const options = data?.items || []

  return (
    <Autocomplete
      value={value}
      disabled={disabled}
      onChange={(_, v) => onChange(v)}
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      options={value && !options.some((o) => o._id === value._id) ? [value, ...options] : options}
      getOptionLabel={(c) => `${c.name} · ${c.customerId}`}
      isOptionEqualToValue={(a, b) => a._id === b._id}
      filterOptions={(x) => x}
      loading={loading && query.length >= 2}
      noOptionsText={query.length < 2 ? 'Type at least 2 characters' : 'No customers found'}
      renderOption={(props, c) => (
        <li {...props} key={c._id}>
          <div>
            <p className="text-sm font-medium">{c.name}</p>
            <p className="text-xs text-muted">{c.customerId} · +91 {c.mobile}</p>
          </div>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Customer"
          placeholder="Search by name, mobile or ID"
          error={error}
          helperText={helperText || ' '}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && query.length >= 2 ? <CircularProgress size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  )
}
