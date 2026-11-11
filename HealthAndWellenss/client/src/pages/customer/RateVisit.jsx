import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Rating from '@mui/material/Rating'
import TextField from '@mui/material/TextField'
import PageHeader from '../../components/common/PageHeader.jsx'
import { ErrorState, Loader } from '../../components/common/Feedback.jsx'
import { customerApi } from '../../api/index.js'
import { useToast } from '../../context/FeedbackContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { RATING_LABELS } from '../../config.js'
import { formatDate } from '../../utils/format.js'

const MAX = 1000

// Visit ki rating (1-5 star) + optional comment
const RateVisit = () => {
  const { id } = useParams()
  const { data: visit, loading, error } = useFetch(() => customerApi.appointment(id), [id])
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(-1)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const navigate = useNavigate()
  const toast = useToast()

  if (loading && !visit) return <Loader />
  if (error) return <ErrorState message={error} />

  const submit = async (e) => {
    e.preventDefault()
    if (!rating) return setFormError('Please select a star rating')
    setSubmitting(true)
    try {
      const res = await customerApi.feedback({ appointmentId: id, rating, comment: comment.trim() })
      toast.success(res.message)
      navigate('/history', { replace: true })
    } catch (err) {
      setFormError(err.message)
      setSubmitting(false)
    }
  }

  const shown = hover !== -1 ? hover : rating

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Rate Your Experience" back />
      <div className="surface px-6 py-8 text-center">
        <p className="font-medium">{visit.therapyName}</p>
        <p className="text-sm text-muted">{formatDate(visit.date)}{visit.therapist && ` · ${visit.therapist}`}</p>

        {visit.status !== 'completed' ? (
          <Alert severity="info" sx={{ mt: 4, textAlign: 'left' }}>You can rate this visit after your session is completed.</Alert>
        ) : visit.rating ? (
          <div className="mt-6">
            <Rating value={visit.rating} readOnly size="large" />
            <p className="mt-2 text-sm text-muted">You have already rated this visit. Thank you!</p>
            <Button component={Link} to="/history" sx={{ mt: 2 }}>Back to history</Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <Rating
              value={rating}
              onChange={(_, v) => { setRating(v || 0); setFormError('') }}
              onChangeActive={(_, v) => setHover(v)}
              size="large"
              sx={{ mt: 5, fontSize: { xs: '2.8rem', sm: '3.2rem' }, color: 'secondary.main' }}
            />
            <p className="mt-2 h-7 font-serif text-2xl font-semibold text-brand-700">{RATING_LABELS[shown] || ''}</p>
            <TextField
              label="Tell us more about your experience (Optional)"
              placeholder="Your feedback helps us improve..."
              multiline
              minRows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, MAX))}
              helperText={`${comment.length}/${MAX}`}
              slotProps={{ formHelperText: { sx: { textAlign: 'right' } } }}
              sx={{ mt: 4 }}
            />
            {formError && <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>{formError}</Alert>}
            <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 3 }} disabled={submitting}>
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default RateVisit
