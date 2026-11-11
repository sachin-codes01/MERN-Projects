import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Close from '@mui/icons-material/Close'
import TherapyImage from './TherapyImage.jsx'
import { mediaUrl } from '../../api/client.js'

const TherapyGallery = ({ therapy }) => {
  const images = [...new Set([therapy.image, ...(therapy.images || [])].filter(Boolean))]
  const [selected, setSelected] = useState('')
  const [open, setOpen] = useState(false)
  const current = images.includes(selected) ? selected : images[0]
  return <div className="min-w-0 lg:sticky lg:top-32 lg:self-start">
    {current ? <button type="button" onClick={() => setOpen(true)} className="block w-full text-left" aria-label={`Enlarge ${therapy.name} photo`}><TherapyImage therapy={{ ...therapy, image: current }} className="aspect-[4/3] w-full text-5xl" /></button> : <TherapyImage therapy={therapy} className="aspect-[4/3] w-full text-5xl" />}
    {images.length > 0 && <p className="my-3 text-xs text-muted">Photo {images.indexOf(current) + 1} of {images.length} ? Select a thumbnail or tap the photo to enlarge.</p>}
    {images.length > 1 && <div className="grid grid-cols-4 gap-2" aria-label="Therapy photo gallery">{images.map((url, index) => <button key={url} type="button" aria-label={`Show ${therapy.name} photo ${index + 1}`} aria-pressed={current === url} onClick={() => setSelected(url)} className={`overflow-hidden border-2 p-0.5 transition-colors ${current === url ? 'border-brand-700' : 'border-transparent hover:border-brand-300'}`}><TherapyImage therapy={{ ...therapy, image: url }} className="aspect-square w-full text-xs" /></button>)}</div>}
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth aria-label={`${therapy.name} photo preview`}>
      <div className="relative bg-cream p-3 pt-14 sm:p-6 sm:pt-14"><IconButton onClick={() => setOpen(false)} aria-label="Close photo preview" sx={{ position: 'absolute', top: 6, right: 6 }}><Close /></IconButton>{current && <img src={mediaUrl(current)} alt={`${therapy.name} photo ${images.indexOf(current) + 1}`} className="max-h-[75vh] w-full object-contain" />}</div>
    </Dialog>
  </div>
}
export default TherapyGallery
