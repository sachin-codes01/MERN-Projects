import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { staffApi } from '../../api/index.js'
import { mediaUrl } from '../../api/client.js'

import { validImageUrl } from '../../utils/therapyImages.js'
const TherapyPhotos = ({ image, images, onChange, onBusyChange, disabled }) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const upload = async (event, cover = false) => {
    const files = [...event.target.files]
    event.target.value = ''
    if (!files.length) return
    const existing = images.filter(Boolean)
    if (!cover && existing.length + files.length > 12) return setError('You can add up to 12 gallery images')
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) return setError('Choose JPEG, PNG or WebP files, each up to 5 MB')
    setBusy(true); onBusyChange(true); setError('')
    const added = []
    try {
      for (const file of files) {
        const response = await staffApi.uploadTherapyImage(file)
        added.push(response.data.url)
      }
    } catch (err) { setError(err.message) }
    finally {
      if (added.length) {
        if (cover) onChange({ image: added[0] })
        else { const next = [...existing, ...added]; onChange({ image: image || added[0], images: [...next, ...Array(Math.max(0, 4 - next.length)).fill('')] }) }
      }
      setBusy(false); onBusyChange(false)
    }
  }
  return <section className="my-5 border-y border-brand-200 py-5" aria-label="Therapy images">
    <h3 className="heading text-2xl">Therapy images</h3>
    <p className="mb-4 mt-1 text-xs leading-6 text-muted">The cover appears on therapy cards. Add 4 or more gallery photos for the details page (up to 12). Upload JPEG, PNG or WebP files up to 5 MB each, or paste image URLs.</p>
    <div className="flex items-start gap-3">
      {image && validImageUrl(image) && <img src={mediaUrl(image)} alt="Cover preview" className="h-20 w-20 shrink-0 object-cover" />}
      <TextField label="Card cover image URL" value={image} onChange={e => onChange({ image: e.target.value })} disabled={busy || disabled} error={Boolean(image && !validImageUrl(image.trim()))} helperText="Main image on the therapy card" />
    </div>
    <Button component="label" variant="outlined" disabled={busy || disabled} sx={{ mb: 3 }}>Upload cover<input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e => upload(e, true)} disabled={busy || disabled} /></Button>
    <div className="grid gap-4 sm:grid-cols-2">
      {images.map((url, index) => <div key={index} className="min-w-0">
        {url && validImageUrl(url.trim()) && <img src={mediaUrl(url.trim())} alt={`Gallery preview ${index + 1}`} loading="lazy" className="mb-2 aspect-[4/3] w-full object-cover" />}
        <TextField label={`Gallery image ${index + 1}`} value={url} onChange={e => onChange({ images: images.map((item, i) => i === index ? e.target.value : item) })} disabled={busy || disabled} error={Boolean(url && !validImageUrl(url.trim()))} helperText={url && !validImageUrl(url.trim()) ? 'Enter a valid image URL' : ' '} />
        {url && <div className="flex flex-wrap gap-1"><Button size="small" disabled={busy || disabled} onClick={() => onChange({ image: url.trim() })}>Use as cover</Button><Button size="small" color="error" disabled={busy || disabled} onClick={() => onChange({ images: images.map((item, i) => i === index ? '' : item) })}>Remove</Button></div>}
      </div>)}
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      <Button component="label" variant="outlined" disabled={busy || disabled}>Upload gallery photos<input type="file" multiple hidden accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={busy || disabled} /></Button>
      <Button disabled={busy || disabled || images.length >= 12} onClick={() => onChange({ images: [...images, ''] })}>Add image URL slot</Button>
    </div>
    {busy && <p role="status" className="mt-3 text-sm text-muted">Uploading images? Please wait before saving.</p>}
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
  </section>
}
export default TherapyPhotos
