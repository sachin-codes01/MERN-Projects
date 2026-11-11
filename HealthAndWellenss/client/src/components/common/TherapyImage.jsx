import { useState } from 'react'
import { mediaUrl } from '../../api/client.js'

// Admin photos take priority. Without one, show a typographic cover rather than a misleading treatment photo.
const TherapyImage = ({ therapy, className = '', index }) => {
  const [failedImage, setFailedImage] = useState('')
  if (therapy?.image && failedImage !== therapy.image) {
    return <img src={mediaUrl(therapy.image)} alt={therapy.name} loading="lazy" decoding="async" onError={() => setFailedImage(therapy.image)} className={`object-cover ${className}`} />
  }
  const name = therapy?.name || 'Wellness'
  const tone = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 3
  return (
    <div className={`therapy-cover therapy-cover--${tone} ${className}`} aria-hidden="true">
      <img src="/images/logo-transparent.png" alt="" className={`therapy-cover-mark ${tone === 2 ? 'brand-logo-on-dark' : ''}`} />
      <span className="therapy-cover-title">{name}</span>
      {index !== undefined && <span className="therapy-cover-number">{String(index + 1).padStart(2, '0')}</span>}
    </div>
  )
}
export default TherapyImage
