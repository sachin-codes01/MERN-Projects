const accents = {
  'intro-title': 'jasmine',
  'services-title': 'pink-lotus',
  'journey-title': 'amber-butterfly',
  'loyalty-title': 'sunflower',
  'aftercare-title': 'blue-hydrangea',
  'faq-title': 'daisy',
  'contact-title': 'cherry-blossoms',
}

export default function DecoratedHeading({ id, children }) {
  return <h2 data-butterfly-land id={id} className="decorated-heading">
    <span className="decorated-heading-copy">{children}</span>
    <span className="heading-orbit" aria-hidden="true" />
    <img data-butterfly-land="flower" className="heading-flower" src={`/images/botanicals/${accents[id] || 'jasmine'}.png`} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable="false" />
  </h2>
}


