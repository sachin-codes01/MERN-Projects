import { useEffect, useRef } from 'react'
import './SectionFlowerScatter.css'

const flowers = ['cherry-blossoms', 'sunflower', 'blue-hydrangea', 'daisy', 'violets', 'pink-blossoms', 'jasmine', 'hibiscus']
const placements = {
  services: [[7.2,12.8],[13.8,9.6],[24.1,14.3],[28.7,10.4],[39.4,12.1],[48.3,8.7],[45.2,29.4],[47.6,44.8],[43.1,65.6],[8.5,89.2],[17.6,85.4],[24.3,90.1],[34.8,86.2],[40.7,89.6],[48.4,82.8]],
  introduction: [[24.4,16.8],[32.1,11.7],[43.7,18.9],[50.8,13.4],[61.2,17.2],[73.8,10.5],[82.1,14.6],[40.3,29.1],[44.6,43.8],[26.2,84.4],[34.7,78.6],[43.2,87.3],[51.4,81.5]],
  faq: [[5.1,79.3],[12.6,68.4],[19.7,83.1],[28.3,72.6],[9.4,88.2],[23.8,90.4],[32.1,84.7]],
  contact: [[34.2,14.8],[42.8,10.7],[54.3,17.1],[61.2,12.3],[73.8,9.4],[82.4,16.6],[93.1,21.8],[6.3,37.4],[15.4,30.8],[25.1,39.6],[5.8,81.2],[15.7,88.4],[25.6,77.1],[32.4,86.7],[75.2,32.6],[85.8,28.1],[94.2,43.7],[92.7,61.3],[76.4,83.6],[85.1,76.2],[94.1,87.4]],
}

// Additional irregular points fill gaps around the original arrangements.
const gapFill = {
  services: [[11.4,15.1],[20.2,9.3],[34.6,15.7],[43.8,10.2],[49.1,23.5],[45.3,55.7],[5.8,83.4],[13.1,91.2],[29.6,84.1],[38.2,91.4],[46.3,88.7]],
  introduction: [[20.8,13.5],[29.4,20.1],[37.5,12.6],[48.2,21.3],[56.3,11.8],[66.7,18.4],[77.2,16.1],[41.7,36.2],[23.1,89.1],[30.6,80.3],[39.1,84.8],[47.9,77.7],[55.4,87.2]],
  faq: [[4.2,69.8],[10.7,78.1],[17.3,72.5],[24.6,79.8],[30.1,64.9],[14.8,88.9],[33.7,77.2]],
  contact: [[38.3,18.1],[48.5,12.4],[58.2,9.3],[68.7,16.5],[78.8,20.2],[89.2,11.9],[95.3,32.7],[10.4,33.2],[20.2,39.4],[3.9,70.2],[11.5,77.3],[21.3,86.8],[29.8,81.1],[36.1,91.2],[80.1,24.8],[88.4,39.3],[95.8,52.1],[74.2,73.6],[81.4,88.2],[91.7,78.3]],
}

// Stable variation looks organic without moving flowers on re-renders or resize.
const flowerVariation = (index, variant) => {
  const seed = (index + 1) * 137 + variant.charCodeAt(0) * 29
  return { angle: (seed % 67) - 33, scale: .72 + (seed % 43) / 100, asset: (seed % 17) % flowers.length }
}

export default function SectionFlowerScatter({ variant }) {
  const ref = useRef(null)
  useEffect(() => {
    const layer = ref.current
    const section = layer?.parentElement
    if (!section) return
    let frame
    // API-loaded content and expanded FAQs must always take precedence over flowers.
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const protectedRects = [...section.querySelectorAll('h2,h3,p,a,button,summary,.studio-number,.folio,.botanical-scene,.garden-branch,.garden-portrait-flowers')]
          .map(el => el.getBoundingClientRect()).filter(r => r.width && r.height)
        layer.querySelectorAll('img').forEach(img => {
          const r = img.getBoundingClientRect()
          const blocked = protectedRects.some(b => r.left < b.right + 8 && r.right > b.left - 8 && r.top < b.bottom + 8 && r.bottom > b.top - 8)
          img.style.visibility = blocked ? 'hidden' : 'visible'
        })
      })
    }
    const observer = new ResizeObserver(update)
    observer.observe(section)
    section.querySelectorAll('h2,p,.studio-therapy-list,.studio-faq-list').forEach(el => observer.observe(el))
    window.addEventListener('resize', update)
    section.addEventListener('load', update, true)
    section.addEventListener('animationend', update, true)
    document.fonts.ready.then(() => { if (ref.current) update() })
    update()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', update)
      section.removeEventListener('load', update, true)
      section.removeEventListener('animationend', update, true)
    }
  }, [])
  return <div ref={ref} className="section-flower-scatter" aria-hidden="true">
    {[...placements[variant], ...gapFill[variant]].map(([x,y],i) => {
      const variation = flowerVariation(i, variant)
      return <img key={i} src={`/images/botanicals/${flowers[variation.asset]}.png`} alt="" loading="lazy" decoding="async" draggable="false" width="64" height="64" style={{left:`${x}%`,top:`${y}%`,'--flower-angle':`${variation.angle}deg`,'--flower-scale':variation.scale, '--flower-size': y < 20 ? '44px' : 'clamp(42px,4.6vw,68px)'}} />
    })}
  </div>
}
