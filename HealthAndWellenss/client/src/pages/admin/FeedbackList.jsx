import { useState } from 'react'
import { Link } from 'react-router-dom'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import LinearProgress from '@mui/material/LinearProgress'
import Rating from '@mui/material/Rating'
import Switch from '@mui/material/Switch'
import StarOutline from '@mui/icons-material/StarBorder'
import { EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx'
import { staffApi } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/FeedbackContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { formatDateTime } from '../../utils/format.js'

// Ratings & feedback — average, star distribution, filter, testimonial toggle (admin)
const FeedbackList = () => {
  const { staff } = useAuth()
  const [rating, setRating] = useState('')
  const { data, loading, error, reload, setData } = useFetch(() => staffApi.feedback({ rating }), [rating])
  const toast = useToast()

  const togglePublic = async (f) => {
    try {
      const res = await staffApi.updateFeedback(f._id, { isPublic: !f.isPublic })
      setData((d) => ({ ...d, items: d.items.map((x) => (x._id === f._id ? { ...x, isPublic: !f.isPublic } : x)) }))
      toast.success(res.message)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <h1 className="heading mb-5 text-3xl sm:text-4xl">Ratings & Feedback</h1>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data ? (
        <ListSkeleton rows={4} />
      ) : (
        <>
          <section className="surface mb-5 grid gap-6 p-5 sm:grid-cols-[auto_1fr]">
            <div className="text-center sm:pr-6">
              <p className="font-serif text-6xl font-bold text-brand-700">{data.avg || '–'}</p>
              <Rating value={data.avg} precision={0.1} readOnly />
              <p className="text-sm text-muted">{data.total} review{data.total === 1 ? '' : 's'}</p>
            </div>
            <div className="flex flex-col justify-center gap-1.5">
              {data.distribution.map((d) => (
                <button key={d.rating} onClick={() => setRating(rating === String(d.rating) ? '' : String(d.rating))} className="flex items-center gap-3 rounded px-1 text-sm hover:bg-brand-50">
                  <span className="w-6 text-right">{d.rating}★</span>
                  <LinearProgress variant="determinate" value={data.total ? (d.count / data.total) * 100 : 0} color="secondary" sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                  <span className="w-8 text-right text-muted">{d.count}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="mb-4 flex flex-wrap gap-2">
            {['', '5', '4', '3', '2', '1'].map((r) => (
              <Chip key={r || 'all'} label={r ? `${r} ★` : 'All'} onClick={() => setRating(r)} color={rating === r ? 'primary' : 'default'} variant={rating === r ? 'filled' : 'outlined'} />
            ))}
          </div>

          {data.items.length === 0 ? (
            <EmptyState icon={<StarOutline />} title="No feedback yet" message="Ratings appear here after customers rate their visits." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {data.items.map((f) => (
                <article key={f._id} className="surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Rating value={f.rating} readOnly size="small" />
                      <Link to={`/admin/customers/${f.customer?._id}`} className="block text-sm font-medium hover:underline">{f.customer?.name}</Link>
                      <p className="text-xs text-muted">{f.therapyName} · {formatDateTime(f.createdAt)}</p>
                    </div>
                    {staff.role === 'admin' && (
                      <FormControlLabel
                        sx={{ mr: 0 }}
                        control={<Switch size="small" checked={f.isPublic} onChange={() => togglePublic(f)} />}
                        label={<span className="text-xs text-muted">Testimonial</span>}
                        labelPlacement="start"
                      />
                    )}
                  </div>
                  {f.comment ? <p className="mt-2 text-sm">“{f.comment}”</p> : <p className="mt-2 text-xs italic text-muted">No comment</p>}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default FeedbackList
