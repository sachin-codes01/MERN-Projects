import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { BarChart } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
import Download from '@mui/icons-material/Download'
import PersonAddAlt from '@mui/icons-material/PersonAddAlt'
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined'
import CurrencyRupee from '@mui/icons-material/CurrencyRupee'
import StarOutline from '@mui/icons-material/StarBorder'
import { Panel, StatCard } from '../../components/admin/AdminUi.jsx'
import { ErrorState, Loader } from '../../components/common/Feedback.jsx'
import { staffApi } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { downloadCsv } from '../../utils/downloads.js'
import { addDays, formatCurrency, formatDate, todayStr } from '../../utils/format.js'

const PRESETS = { 7: 'Last 7 days', 30: 'Last 30 days', 90: 'Last 90 days' }

// Reports (sirf admin): date range ke hisaab se revenue, visits, therapy breakdown + CSV export
const Reports = () => {
  const { staff } = useAuth()
  const [range, setRange] = useState({ from: addDays(todayStr(), -29), to: todayStr(), preset: '30' })
  const [metric, setMetric] = useState('revenue')
  const { data, loading, error, reload } = useFetch(() => staffApi.reports({ from: range.from, to: range.to }), [range.from, range.to])

  if (staff.role !== 'admin') return <Navigate to="/admin" replace />

  const setPreset = (days) => setRange({ from: addDays(todayStr(), -(Number(days) - 1)), to: todayStr(), preset: days })

  const exportCsv = () => {
    downloadCsv(`report_${data.from}_to_${data.to}.csv`, [
      ['Date', 'Appointments', 'Revenue (INR)', 'New customers'],
      ...data.series.map((s) => [s.date, s.appointments, s.revenue, s.newCustomers]),
      [],
      ['Therapy', 'Bookings', 'Revenue (INR)', 'Share %'],
      ...data.byTherapy.map((t) => [t.name, t.count, t.revenue, t.percent]),
    ])
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="heading text-3xl sm:text-4xl">Reports & Analytics</h1>
        <Button variant="outlined" startIcon={<Download />} onClick={exportCsv} disabled={!data}>Export CSV</Button>
      </div>

      <div className="surface flex flex-wrap items-center gap-3 p-3">
        <ToggleButtonGroup size="small" exclusive value={range.preset} onChange={(_, v) => v && setPreset(v)}>
          {Object.entries(PRESETS).map(([d, label]) => <ToggleButton key={d} value={d}>{label}</ToggleButton>)}
        </ToggleButtonGroup>
        <div className="flex items-center gap-2">
          <TextField type="date" size="small" label="From" value={range.from} onChange={(e) => e.target.value && e.target.value <= range.to && setRange((r) => ({ ...r, from: e.target.value, preset: '' }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 160 }} />
          <TextField type="date" size="small" label="To" value={range.to} onChange={(e) => e.target.value && e.target.value >= range.from && setRange((r) => ({ ...r, to: e.target.value, preset: '' }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 160 }} />
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data ? (
        <Loader />
      ) : data && (
        <>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<CurrencyRupee />} label="Revenue (completed)" value={formatCurrency(data.revenue)} hint={data.discountGiven ? `${formatCurrency(data.discountGiven)} discounts given` : ' '} />
            <StatCard icon={<TaskAltOutlined />} label="Completed visits" value={data.appointments.completed} hint={`${data.appointments.cancelled} cancelled · ${data.appointments.noShow} no-show`} tone="blue" />
            <StatCard icon={<PersonAddAlt />} label="New customers" value={data.newCustomers} tone="gold" />
            <StatCard icon={<StarOutline />} label="Average rating" value={data.avgRating || '–'} hint={`${data.ratingCount} reviews`} tone="rose" />
          </div>

          <Panel
            title="Daily Trend"
            action={
              <ToggleButtonGroup size="small" exclusive value={metric} onChange={(_, v) => v && setMetric(v)}>
                <ToggleButton value="revenue">Revenue</ToggleButton>
                <ToggleButton value="appointments">Visits</ToggleButton>
                <ToggleButton value="newCustomers">Customers</ToggleButton>
              </ToggleButtonGroup>
            }
          >
            <LineChart
              height={280}
              xAxis={[{ scaleType: 'point', data: data.series.map((s) => formatDate(s.date, { year: undefined })), tickLabelInterval: (_, i) => i % Math.ceil(data.series.length / 8) === 0 }]}
              yAxis={[{ width: 56 }]}
              series={[{ data: data.series.map((s) => s[metric]), area: true, color: '#1f5135', showMark: data.series.length <= 31 }]}
              margin={{ left: 4, right: 12, top: 16, bottom: 4 }}
              sx={{ '& .MuiLineChart-area': { fillOpacity: 0.12 } }}
            />
          </Panel>

          <Panel title="Therapy Performance">
            {data.byTherapy.length === 0 ? (
              <p className="text-sm text-muted">No bookings in this period.</p>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <BarChart
                  height={Math.max(220, data.byTherapy.length * 44)}
                  layout="horizontal"
                  yAxis={[{ scaleType: 'band', data: data.byTherapy.map((t) => t.name), width: 150 }]}
                  series={[{ data: data.byTherapy.map((t) => t.count), color: '#b08a3e', label: 'Bookings' }]}
                  hideLegend
                  margin={{ left: 4, right: 16, top: 8, bottom: 4 }}
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-100 text-left text-xs text-muted">
                        <th className="py-2 font-medium">Therapy</th>
                        <th className="py-2 text-right font-medium">Bookings</th>
                        <th className="py-2 text-right font-medium">Revenue</th>
                        <th className="py-2 text-right font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byTherapy.map((t) => (
                        <tr key={t.name} className="border-b border-brand-50 last:border-0">
                          <td className="py-2 pr-2">{t.name}</td>
                          <td className="py-2 text-right">{t.count}</td>
                          <td className="py-2 text-right">{formatCurrency(t.revenue)}</td>
                          <td className="py-2 text-right">{t.percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  )
}

export default Reports
