import { Link } from 'react-router-dom'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import WorkspacePremium from '@mui/icons-material/WorkspacePremium'
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined'
import PageHeader from '../../components/common/PageHeader.jsx'
import { EmptyState, ErrorState, Loader } from '../../components/common/Feedback.jsx'
import { customerApi } from '../../api/index.js'
import { useFetch } from '../../hooks/useFetch.js'
import { formatCurrency, formatDate } from '../../utils/format.js'

const TIER_STYLE = {
  Gold: 'bg-gold-700',
  Silver: 'bg-slate-600',
  Bronze: 'bg-brand-700',
}

// Membership tier, points aur eligible offers
const Loyalty = () => {
  const { data, loading, error, reload } = useFetch(() => customerApi.loyalty())

  if (loading && !data) return <Loader />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const progress = data.nextTier ? Math.min(100, Math.round((data.visits / data.nextTier.target) * 100)) : 100

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Loyalty & Offers" back />

      <div className="grid gap-5 md:grid-cols-2">
        <section className="surface overflow-hidden">
          <div className={`flex flex-col items-center ${TIER_STYLE[data.tier]} px-6 py-7 text-center text-white`}>
            <WorkspacePremium sx={{ fontSize: 48 }} />
            <p className="mt-2 font-serif text-3xl font-semibold">You are a {data.tier} Member</p>
            <p className="text-sm opacity-90">{data.visits} visit{data.visits === 1 ? '' : 's'} completed</p>
          </div>
          <div className="p-5">
            {data.nextTier ? (
              <>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted">Progress to {data.nextTier.name}</span>
                  <span className="font-medium">{data.visits}/{data.nextTier.target}</span>
                </div>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} color="secondary" />
                <p className="mt-2 text-xs text-muted">
                  {data.nextTier.visitsNeeded} more visit{data.nextTier.visitsNeeded === 1 ? '' : 's'} to unlock {data.nextTier.name} benefits
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">You've reached our highest tier. Thank you for your loyalty!</p>
            )}
          </div>
        </section>

        <section className="flex flex-col justify-center border-t border-brand-200 px-2 py-8 md:border-t-0 md:border-l md:px-10">
          <p className="text-sm text-muted">Loyalty Points</p>
          <p className="font-serif text-6xl font-bold text-brand-700">{data.points}</p>
          <p className="text-sm text-muted">Worth {formatCurrency(data.points * data.pointValue)} · 1 point = {formatCurrency(data.pointValue)}</p>
          <p className="mt-4 rounded-xl bg-brand-50 p-3 text-xs text-muted">
            Earn {data.pointsPerVisit} points on every completed visit. Ask our staff to redeem your points at the centre.
          </p>
        </section>
      </div>

      <h2 className="heading mb-3 mt-8 text-2xl">Available Offers</h2>
      {data.offers.length === 0 ? (
        <EmptyState icon={<LocalOfferOutlined />} title="No offers right now" message="Keep visiting — new offers unlock as you reach higher tiers." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.offers.map((o) => (
            <article key={o._id} className="flex flex-wrap items-center gap-4 border-t border-brand-200 py-6">
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center border-l-2 border-gold-500 bg-gold-100/50 text-gold-700">
                <span className="text-xl font-bold leading-none">{o.discountPercent}%</span>
                <span className="text-[10px] font-medium">OFF</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{o.title}</p>
                {o.description && <p className="text-xs text-muted">{o.description}</p>}
                <p className="mt-1 text-xs text-muted">Valid till {formatDate(o.validTill)}</p>
              </div>
              <Button component={Link} to={`/book?offer=${o._id}`} variant="contained" size="small">
                Use Now
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default Loyalty
