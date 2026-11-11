import Chip from '@mui/material/Chip'

// Appointment / reminder status ka rangeen label
const STYLES = {
  scheduled: { label: 'Scheduled', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'default' },
  'no-show': { label: 'No-show', color: 'warning' },
  sent: { label: 'Sent', color: 'success' },
}

const StatusChip = ({ status, size = 'small' }) => {
  const s = STYLES[status] || { label: status, color: 'default' }
  return <Chip label={s.label} color={s.color} size={size} variant="outlined" />
}

export const TierChip = ({ tier, size = 'small' }) => {
  const colors = {
    Gold: 'bg-gold-100 text-gold-700 border-gold-300',
    Silver: 'bg-slate-100 text-slate-600 border-slate-300',
    Bronze: 'bg-orange-50 text-orange-800 border-orange-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 font-medium ${size === 'small' ? 'py-0.5 text-xs' : 'py-1 text-sm'} ${colors[tier] || colors.Bronze}`}>
      {tier} Member
    </span>
  )
}

export default StatusChip
