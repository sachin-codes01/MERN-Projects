import './BotanicalScene.css'
import { useAmbientMotion } from '../../hooks/useGentleMotion.js'

// Keep each composition in its own reserved space so artwork never covers controls.
const scenes = {
  sanctuary: [['bamboo', 'foliage'], ['moss-rocks', 'rocks'], ['white-lotus', 'bloom'], ['pink-butterfly', 'butterfly']],
  blossom: [['rose-vine', 'vine'], ['jasmine', 'bloom'], ['amber-butterfly', 'butterfly']],
  lotus: [['palm-trees', 'palms'], ['moss-rocks', 'rocks'], ['pink-lotus', 'bloom'], ['blue-butterflies', 'butterfly']],
  calm: [['blue-hydrangea', 'bloom'], ['bamboo', 'foliage'], ['pink-butterfly', 'butterfly']],
  garden: [['maple-tree', 'tree'], ['moss-rocks', 'rocks'], ['pink-blossoms', 'bloom'], ['amber-butterfly', 'butterfly']],
  portrait: [['floral-portrait', 'portrait'], ['vintage-butterflies', 'flock']],
  courtyard: [['floral-column', 'column'], ['vintage-butterflies', 'flock']],
}

export default function BotanicalScene({ variant = 'sanctuary', className = '', eager = false }) {
  const motionRef = useAmbientMotion()
  return <div ref={motionRef} data-motion-paused="true" className={`botanical-scene botanical-scene--${variant} ${className}`} aria-hidden="true">
    <span className="botanical-scene-orbit" />
    {scenes[variant].map(([asset, role]) => <img data-butterfly-core-x={asset === 'white-lotus' ? .52 : undefined} data-butterfly-core-y={asset === 'white-lotus' ? .34 : undefined} data-butterfly-land={role === 'bloom' ? 'flower' : undefined} key={asset} className={`botanical-piece botanical-piece--${role}`} src={`/images/botanicals/${asset}.png`} alt="" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager && role === 'bloom' ? 'high' : 'auto'} decoding="async" draggable="false" />)}
  </div>
}


