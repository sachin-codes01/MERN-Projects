import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Search from '@mui/icons-material/Search'
import AccessTime from '@mui/icons-material/AccessTime'
import ChevronRight from '@mui/icons-material/ChevronRight'
import PageHeader from '../../components/common/PageHeader.jsx'
import TherapyImage from '../../components/common/TherapyImage.jsx'
import BotanicalScene from '../../components/brand/BotanicalScene.jsx'
import { EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx'
import { publicApi } from '../../api/index.js'
import { useFetch } from '../../hooks/useFetch.js'
import { durationLabel, formatCurrency } from '../../utils/format.js'

const SORTS = {
  default: { label: 'Recommended', fn: () => 0 },
  priceLow: { label: 'Price: Low to High', fn: (a, b) => a.price - b.price },
  priceHigh: { label: 'Price: High to Low', fn: (a, b) => b.price - a.price },
  duration: { label: 'Shortest first', fn: (a, b) => a.durationMin - b.durationMin },
}

// Saari therapies — mobile pe list, desktop pe cards ki grid
const Therapies = () => {
  const { data, loading, error, reload } = useFetch(() => publicApi.therapies())
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data || [])
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.areas.some((a) => a.toLowerCase().includes(q)))
      .sort(SORTS[sort].fn)
  }, [data, search, sort])

  return (
    <div>
      <section className="catalogue-intro">
        <div><p className="eyebrow">Health &amp; Wellness Centre</p><PageHeader title="Our Therapies" subtitle="Natural healing therapies to relax, restore and rebalance." back /></div>
        <BotanicalScene variant="blossom" className="catalogue-botanical" />
      </section>

      <div className="mb-10 flex flex-col gap-4 border-b border-brand-200 pb-6 sm:flex-row">
        <TextField
          size="small"
          label="Search therapy or body area"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
        />
        <TextField select size="small" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: { sm: 220 } }} label="Sort by">
          {Object.entries(SORTS).map(([key, s]) => (
            <MenuItem key={key} value={key}>{s.label}</MenuItem>
          ))}
        </TextField>
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data ? (
        <ListSkeleton rows={5} height={96} />
      ) : list.length === 0 && !error ? (
        <EmptyState title="No therapies found" message="Try a different search." />
      ) : (
        <div className="therapy-catalogue grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t, index) => (
            <Link
              key={t._id}
              to={`/therapies/${t.slug}`}
              className="therapy-entry group flex min-w-0 flex-col items-stretch gap-4 border-b border-brand-200 pb-7"
            >
              <TherapyImage therapy={t} index={index} className="aspect-[4/3] w-full text-3xl" />
              <div className="min-w-0 flex-1">
                <p className="font-serif text-3xl font-medium leading-tight text-ink transition-colors group-hover:text-brand-700">{t.name}</p>
                <p className="mt-3 font-medium text-brand-700">{formatCurrency(t.price)}</p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <AccessTime sx={{ fontSize: 14 }} /> {durationLabel(t)}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted">{t.description}</p>
              </div>
              <ChevronRight className="self-end text-brand-700" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Therapies

