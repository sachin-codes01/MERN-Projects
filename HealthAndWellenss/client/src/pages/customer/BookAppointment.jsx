import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import AccessTime from '@mui/icons-material/AccessTime'
import PageHeader from '../../components/common/PageHeader.jsx'
import TherapyImage from '../../components/common/TherapyImage.jsx'
import { DateStrip, SlotGrid } from '../../components/common/SlotPicker.jsx'
import { ErrorState, Loader } from '../../components/common/Feedback.jsx'
import { customerApi, publicApi } from '../../api/index.js'
import { useToast } from '../../context/FeedbackContext.jsx'
import { useSettings } from '../../context/SettingsContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { durationLabel, formatCurrency, formatDate, todayStr } from '../../utils/format.js'

// Booking: therapy → date → time slot → (offer) → Book Now
const BookAppointment = () => {
  const [params] = useSearchParams()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const toast = useToast()

  const therapies = useFetch(() => publicApi.therapies())
  const loyalty = useFetch(() => customerApi.loyalty())
  const [therapyId, setTherapyId] = useState(params.get('therapy') || '')
  const [date, setDate] = useState(todayStr())
  const [slot, setSlot] = useState('')
  const [offerId, setOfferId] = useState(params.get('offer') || '')
  const [notes, setNotes] = useState('')
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const slots = useFetch(() => publicApi.slots(date), [date])

  if (therapies.loading && !therapies.data) return <Loader />
  if (therapies.error) return <ErrorState message={therapies.error} onRetry={therapies.reload} />

  // Therapy pehle se chuni na ho to pehli wali
  const selectedId = therapyId || therapies.data[0]?._id
  const therapy = therapies.data.find((t) => t._id === selectedId)
  const offers = loyalty.data?.offers || []
  const offer = offers.find((o) => o._id === offerId)
  const discount = therapy && offer ? Math.round((therapy.price * offer.discountPercent) / 100) : 0
  const slotData = slots.data?.slots
  const slotStillFree = slotData?.find((s) => s.time === slot)?.available
  const canBook = therapy && slot && slotStillFree && !booking

  const pickDate = (d) => {
    setDate(d)
    setSlot('')
    setError('')
  }

  const book = async () => {
    if (!canBook) return
    setBooking(true)
    setError('')
    try {
      const res = await customerApi.book({ therapyId: therapy._id, date, slot, offerId: offer?._id, notes: notes.trim() })
      toast.success('Appointment booked successfully!')
      navigate(`/appointments/${res.data._id}/confirmed`, { replace: true })
    } catch (err) {
      setError(err.message)
      // Slot kisi aur ne le liya ho to slots dobara laao
      if (err.status === 409) {
        setSlot('')
        slots.reload()
      }
      setBooking(false)
    }
  }

  return (
    <div className="booking-page">
      <PageHeader title="Book Appointment" subtitle="Choose your therapy, date and a convenient time." back />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {/* Therapy */}
          <section className="booking-section p-5">
            <TextField select label="Therapy" value={selectedId || ''} onChange={(e) => setTherapyId(e.target.value)}>
              {therapies.data.map((t) => (
                <MenuItem key={t._id} value={t._id}>
                  {t.name} — {formatCurrency(t.price)}
                </MenuItem>
              ))}
            </TextField>
            {therapy && (
              <div className="mt-4 flex items-center gap-4">
                <TherapyImage therapy={therapy} className="h-16 w-16 shrink-0 rounded-xl" />
                <div>
                  <p className="font-medium">{therapy.name}</p>
                  <p className="flex items-center gap-1 text-sm text-muted">
                    {formatCurrency(therapy.price)} · <AccessTime sx={{ fontSize: 14 }} /> {durationLabel(therapy)}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Date + slot */}
          <section className="surface p-5">
            <h2 className="heading mb-3 text-2xl">Select Date</h2>
            <DateStrip value={date} onChange={pickDate} days={settings.bookingWindowDays} />
            <h2 className="heading mb-3 mt-6 text-2xl">Available Slots</h2>
            {slots.error ? (
              <ErrorState message={slots.error} onRetry={slots.reload} />
            ) : (
              <SlotGrid slots={slotData} loading={slots.loading} value={slot} onChange={(s) => { setSlot(s); setError('') }} />
            )}
          </section>

          {/* Offers */}
          {offers.length > 0 && (
            <section className="surface p-5">
              <h2 className="heading mb-2 text-2xl">Apply an Offer</h2>
              <RadioGroup value={offer ? offerId : ''} onChange={(e) => setOfferId(e.target.value)}>
                <FormControlLabel value="" control={<Radio />} label="No offer" />
                {offers.map((o) => (
                  <FormControlLabel
                    key={o._id}
                    value={o._id}
                    control={<Radio />}
                    label={
                      <span className="text-sm">
                        <b className="text-brand-700">{o.discountPercent}% OFF</b> — {o.title}
                        <span className="block text-xs text-muted">Valid till {formatDate(o.validTill)}</span>
                      </span>
                    }
                  />
                ))}
              </RadioGroup>
            </section>
          )}
        </div>

        {/* Summary — desktop pe sticky */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <section className="surface p-5">
            <h2 className="heading mb-4 text-2xl">Booking Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted">Therapy</dt><dd className="text-right font-medium">{therapy?.name || '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Date</dt><dd className="font-medium">{formatDate(date)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Time</dt><dd className="font-medium">{slot || 'Select a slot'}</dd></div>
              <div className="flex justify-between gap-4 border-t border-brand-100 pt-2"><dt className="text-muted">Price</dt><dd>{formatCurrency(therapy?.price)}</dd></div>
              {discount > 0 && (
                <div className="flex justify-between gap-4 text-brand-500"><dt>Offer discount</dt><dd>− {formatCurrency(discount)}</dd></div>
              )}
              <div className="flex justify-between gap-4 border-t border-brand-100 pt-2 text-base"><dt className="font-medium">Total (pay at centre)</dt><dd className="font-semibold text-brand-700">{formatCurrency((therapy?.price || 0) - discount)}</dd></div>
            </dl>

            <TextField
              label="Note for therapist (Optional)"
              placeholder="E.g. prefer female therapist, recent injury"
              multiline
              minRows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 300))}
              sx={{ mt: 3 }}
            />

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

            <Button variant="contained" size="large" fullWidth sx={{ mt: 3 }} disabled={!canBook} onClick={book}>
              {booking ? <CircularProgress size={24} color="inherit" /> : 'Book Now'}
            </Button>
            {!slot && <p className="mt-2 text-center text-xs text-muted">Please select a time slot to continue</p>}
          </section>
        </aside>
      </div>
    </div>
  )
}

export default BookAppointment
