import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import AccessTime from '@mui/icons-material/AccessTime'
import CurrencyRupee from '@mui/icons-material/CurrencyRupee'
import EventAvailable from '@mui/icons-material/EventAvailable'
import Phone from '@mui/icons-material/Phone'
import PageHeader from '../../components/common/PageHeader.jsx'
import TherapyGallery from '../../components/common/TherapyGallery.jsx'
import ContactDialog from '../../components/common/ContactDialog.jsx'
import { EmptyState, Loader } from '../../components/common/Feedback.jsx'
import { publicApi } from '../../api/index.js'
import { useFetch } from '../../hooks/useFetch.js'
import { durationLabel } from '../../utils/format.js'

// Ek therapy ki poori jaankari + book button
const TherapyDetail = () => {
  const { slug } = useParams()
  const { data: therapy, loading, error } = useFetch(() => publicApi.therapy(slug), [slug])
  const [contactOpen, setContactOpen] = useState(false)

  if (loading && !therapy) return <Loader />
  if (error || !therapy) {
    return (
      <EmptyState
        title="Therapy not found"
        message={error}
        action={<Button component={Link} to="/therapies" variant="contained">See all therapies</Button>}
      />
    )
  }

  return (
    <div>
      <PageHeader title={therapy.name} back="/therapies" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TherapyGallery key={therapy._id} therapy={therapy} />

        <div className="flex min-w-0 flex-col py-3 lg:pl-8">
          <div className="flex flex-wrap gap-2">
            <Chip icon={<AccessTime />} label={durationLabel(therapy)} variant="outlined" />
            <Chip icon={<CurrencyRupee />} label={therapy.price.toLocaleString('en-IN')} color="primary" />
          </div>

          <p className="mt-8 max-w-prose leading-8 text-muted">{therapy.description}</p>

          {therapy.areas.length > 0 && (
            <>
              <h2 className="heading mt-6 text-2xl">Areas Addressed</h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {therapy.areas.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-gold-500" /> {a}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
            <Button component={Link} to={`/book?therapy=${therapy._id}`} variant="contained" size="large" startIcon={<EventAvailable />} sx={{ flex: 1 }}>
              Book This Therapy
            </Button>
            <Button variant="outlined" size="large" startIcon={<Phone />} onClick={() => setContactOpen(true)} sx={{ flex: 1 }}>
              Contact the Centre
            </Button>
          </div>
        </div>
      </div>
      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}

export default TherapyDetail
