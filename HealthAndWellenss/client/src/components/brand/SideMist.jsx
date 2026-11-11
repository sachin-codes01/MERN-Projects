import Box from '@mui/material/Box'
import { useAmbientMotion } from '../../hooks/useGentleMotion.js'
import './SideMist.css'

export default function SideMist() {
  const ref = useAmbientMotion()
  return <Box ref={ref} className="side-mist" aria-hidden="true" data-motion-paused="true">
    {['left', 'right'].map(side => <Box key={side} className={`side-mist-edge side-mist-edge--${side}`}>
      <Box className="side-mist-cloud side-mist-cloud--near" />
      <Box className="side-mist-cloud side-mist-cloud--far" />
    </Box>)}
  </Box>
}
