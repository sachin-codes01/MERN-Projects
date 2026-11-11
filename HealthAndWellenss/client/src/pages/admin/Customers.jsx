import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Avatar from '@mui/material/Avatar'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import TextField from '@mui/material/TextField'
import Search from '@mui/icons-material/Search'
import ChevronRight from '@mui/icons-material/ChevronRight'
import PeopleOutline from '@mui/icons-material/PeopleOutlined'
import { TierChip } from '../../components/common/StatusChip.jsx'
import { EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx'
import { staffApi } from '../../api/index.js'
import { useDebounced, useFetch } from '../../hooks/useFetch.js'
import { formatDateTime, initials, maskMobile } from '../../utils/format.js'

// Customer directory — search, sort, pages
const Customers = () => {
  const [params, setParams] = useSearchParams()
  const urlSearch = params.get('search') || ''
  const [search, setSearch] = useState(urlSearch)
  const [syncedUrl, setSyncedUrl] = useState(urlSearch)
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)

  // Upar wale header search se URL badle to box me bhi wahi text
  if (urlSearch !== syncedUrl) {
    setSyncedUrl(urlSearch)
    setSearch(urlSearch)
    setPage(1)
  }
  const query = useDebounced(search.trim())
  const { data, loading, error, reload } = useFetch(() => staffApi.customers({ search: query, sort, page }), [query, sort, page])

  const changeSearch = (value) => {
    setSearch(value)
    setPage(1)
    setParams(value ? { search: value } : {}, { replace: true })
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="heading text-3xl sm:text-4xl">Customer Directory</h1>
          <p className="text-sm text-muted">{data ? `${data.total} customer${data.total === 1 ? '' : 's'}` : ' '}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <TextField
          size="small"
          placeholder="Search by name, mobile or ID..."
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          autoFocus
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
        />
        <TextField select size="small" label="Sort" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }} sx={{ minWidth: { sm: 200 } }}>
          <MenuItem value="recent">Newest first</MenuItem>
          <MenuItem value="visits">Most visits</MenuItem>
          <MenuItem value="name">Name (A–Z)</MenuItem>
        </TextField>
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data ? (
        <ListSkeleton rows={6} height={72} />
      ) : data?.items.length === 0 ? (
        <EmptyState icon={<PeopleOutline />} title="No customers found" message={query ? 'Try a different search.' : 'New registrations will appear here.'} />
      ) : (
        <div className={`surface overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {data?.items.map((c) => (
            <Link key={c._id} to={`/admin/customers/${c._id}`} className="flex items-center gap-3 border-b border-brand-50 px-4 py-3 last:border-0 hover:bg-brand-50/60">
              <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40, fontSize: 14 }}>{initials(c.name)}</Avatar>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-medium">
                  {c.name}
                  {!c.isActive && <span className="rounded bg-red-50 px-1.5 text-[10px] text-red-600">Inactive</span>}
                </p>
                <p className="truncate text-xs text-muted">{c.customerId} · +91 {maskMobile(c.mobile)}</p>
              </div>
              <div className="hidden text-right sm:block">
                <TierChip tier={c.tier} />
                <p className="mt-1 text-xs text-muted">{c.visitsCount} visit{c.visitsCount === 1 ? '' : 's'}</p>
              </div>
              <p className="hidden w-28 text-right text-xs text-muted md:block">Joined {formatDateTime(c.createdAt)}</p>
              <ChevronRight className="text-muted" />
            </Link>
          ))}
        </div>
      )}

      {data?.pages > 1 && (
        <div className="mt-5 flex justify-center">
          <Pagination count={data.pages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </div>
      )}
    </div>
  )
}

export default Customers
