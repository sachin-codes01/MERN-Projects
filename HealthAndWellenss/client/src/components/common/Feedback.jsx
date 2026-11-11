import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import InboxOutlined from '@mui/icons-material/InboxOutlined'

// Loading, error aur khaali list — har page pe ek jaisa dikhne ke liye

export const Loader = ({ full = false, label = 'Loading...' }) => (
  <div className={`flex flex-col items-center justify-center gap-3 text-muted ${full ? 'min-h-screen' : 'py-16'}`}>
    <CircularProgress size={34} />
    <span className="text-sm">{label}</span>
  </div>
)

// Card jaisa placeholder jab tak data aa raha hai
export const ListSkeleton = ({ rows = 3, height = 76 }) => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} variant="rounded" height={height} sx={{ borderRadius: 4 }} />
    ))}
  </div>
)

export const ErrorState = ({ message, onRetry }) => (
  <Alert
    severity="error"
    action={
      onRetry && (
        <Button color="inherit" size="small" onClick={onRetry}>
          Retry
        </Button>
      )
    }
  >
    {message}
  </Alert>
)

export const EmptyState = ({ icon, title, message, action }) => (
  <div className="surface flex flex-col items-center gap-2 px-6 py-12 text-center">
    <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
      {icon || <InboxOutlined />}
    </div>
    <p className="font-serif text-2xl font-semibold text-brand-700">{title}</p>
    {message && <p className="max-w-sm text-sm text-muted">{message}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
)
