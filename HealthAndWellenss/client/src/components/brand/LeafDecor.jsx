// Decorative patton ki daali (welcome/login pages ke kono me) — sirf sajavat, screen reader ignore karega
const LEAVES = [
  { x: 40, y: 150, r: -40, s: 1 },
  { x: 70, y: 120, r: 20, s: 0.9 },
  { x: 95, y: 95, r: -50, s: 0.85 },
  { x: 120, y: 70, r: 15, s: 0.8 },
  { x: 140, y: 45, r: -35, s: 0.7 },
  { x: 60, y: 175, r: 60, s: 0.75 },
]

const LeafDecor = ({ className = '' }) => (
  <svg viewBox="0 0 200 200" className={`pointer-events-none select-none ${className}`} aria-hidden="true">
    <path d="M10 195 C 60 150, 110 100, 165 20" fill="none" stroke="#8a6a2b" strokeWidth="2" strokeLinecap="round" opacity=".55" />
    {LEAVES.map((l, i) => (
      <path
        key={i}
        d="M0 0 C 14 -10, 34 -10, 46 0 C 34 10, 14 10, 0 0 Z"
        transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`}
        fill={i % 2 ? '#2f6b47' : '#1f5135'}
        opacity={0.75 - i * 0.05}
      />
    ))}
  </svg>
)

export default LeafDecor
