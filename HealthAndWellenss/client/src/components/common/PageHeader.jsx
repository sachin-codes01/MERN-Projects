import IconButton from '@mui/material/IconButton'
import ArrowBack from '@mui/icons-material/ArrowBack'
import { useNavigate } from 'react-router-dom'

// Page ka title + back button + right side action
const PageHeader = ({ title, subtitle, back, action }) => {
  const navigate = useNavigate()
  return (
    <div className="mb-8 flex flex-wrap items-start gap-3">
      {back && (
        <IconButton
          aria-label="Go back"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          sx={{ ml: -1, mt: 0.25 }}
        >
          <ArrowBack />
        </IconButton>
      )}
      <div className="min-w-0 flex-1">
        <h1 data-butterfly-land className="heading text-4xl leading-tight md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-xl text-sm leading-7 text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export default PageHeader

