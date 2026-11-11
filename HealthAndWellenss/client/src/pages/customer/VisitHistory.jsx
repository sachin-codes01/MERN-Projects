import { Link } from 'react-router-dom'
import Button from '@mui/material/Button'
import Rating from '@mui/material/Rating'
import HistoryOutlined from '@mui/icons-material/HistoryOutlined'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatusChip from '../../components/common/StatusChip.jsx'
import { EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx'
import { customerApi } from '../../api/index.js'
import { useFetch } from '../../hooks/useFetch.js'
import { formatDate } from '../../utils/format.js'

// Purani completed visits — therapist ka naam, rating (ya "Rate" button)
const VisitHistory = () => {
  const { data, loading, error, reload } = useFetch(() => customerApi.appointments('history'))

  return (
    <div>
      <PageHeader title="Visit History" subtitle={data ? `${data.length} completed visit${data.length === 1 ? '' : 's'}` : ' '} back />

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data ? (
        <ListSkeleton rows={4} height={96} />
      ) : data?.length === 0 ? (
        <EmptyState icon={<HistoryOutlined />} title="No visits yet" message="Your completed sessions will appear here." action={<Button component={Link} to="/book" variant="contained">Book your first session</Button>} />
      ) : (
        <div className="divide-y divide-brand-200 border-t border-brand-200">
          {data?.map((v) => (
            <article key={v._id} className="flex flex-col gap-4 py-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-2xl font-medium">{v.therapyName}</p>
                  <p className="text-sm text-muted">{formatDate(v.date)} · {v.duration}</p>
                  {v.therapist && <p className="mt-1 text-xs text-muted">Therapist: <span className="text-ink">{v.therapist}</span></p>}
                </div>
                <StatusChip status="completed" />
              </div>
              <div className="flex items-center justify-between border-t border-brand-100 pt-3">
                {v.rating ? (
                  <span className="flex items-center gap-2 text-xs text-muted">Your rating <Rating value={v.rating} readOnly size="small" /></span>
                ) : (
                  <>
                    <span className="text-xs text-muted">How was this visit?</span>
                    <Button component={Link} to={`/rate/${v._id}`} size="small" variant="outlined">Rate visit</Button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default VisitHistory
