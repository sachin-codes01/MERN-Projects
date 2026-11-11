import './BotanicalDecorations.css'

const flowers = {
  hero: 'jasmine', introduction: 'pink-blossoms', services: 'pink-lotus',
  loyalty: 'sunflower', aftercare: 'blue-hydrangea', faq: 'daisy', contact: 'white-lotus',
}

const branches = {
  hero: ['pink-flowering-branch', 'green-canopy'],
  introduction: ['bougainvillea-vine', 'green-canopy'],
  services: ['green-canopy', 'purple-flowering-vine'],
  journey: ['falling-leaf-branch', 'green-canopy'],
  loyalty: ['pink-flowering-branch', 'purple-flowering-vine'],
  aftercare: ['purple-flowering-vine', 'falling-leaf-branch'],
  faq: ['bougainvillea-vine', 'green-canopy'],
  contact: ['green-canopy', 'pink-flowering-branch'],
  footer: ['green-canopy', 'falling-leaf-branch'],
}

// Decorations live exclusively in the existing page gutters, outside content.
export default function BotanicalDecorations({ variant }) {
  return <div className={`botanical-decorations botanical-decorations--${variant}`} aria-hidden="true">
    {['left', 'right'].map((side, index) => <div key={side} className={`botanical-edge botanical-edge--${side}`}>
      <img className="botanical-branch-cutout" src={`/images/botanical-branches/${branches[variant]?.[index] || 'green-canopy'}.png`} alt="" loading="lazy" decoding="async" draggable="false" />
    </div>)}
    {flowers[variant] && <img className="botanical-edge-flower" src={`/images/botanicals/${flowers[variant]}.png`} alt="" loading="lazy" decoding="async" draggable="false" width="48" height="48" />}
    {['hero', 'aftercare'].includes(variant) && <img className="botanical-edge-butterfly" src="/images/botanicals/amber-butterfly.png" alt="" loading="lazy" decoding="async" draggable="false" width="24" height="24" />}
  </div>
}

