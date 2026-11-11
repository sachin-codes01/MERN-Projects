import { Component, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import ButterflyController from './ButterflyController.jsx'
import './butterfly.css'

class ButterflyBoundary extends Component {
  state = { failed:false }
  static getDerivedStateFromError() { return { failed:true } }
  componentDidCatch(error) { console.warn('GoldenButterfly disabled:',error.message) }
  render() { return this.state.failed ? null : this.props.children }
}

export default function GoldenButterfly({ size=120, speed=1.2, autoFly=true, autoLand=true, followCursor=true, clickInteraction=true, landingDuration=3500, zIndex=50, onLand, flightSpeed=speed, flapFrequency=3.2, flapAmplitude=.95, wingFlex=.16, turnSensitivity=1, hoverIntensity=1, reducedMotion=false }) {
  const [enabled,setEnabled]=useState(false)
  const [visible,setVisible]=useState(!document.hidden)
  const [lost,setLost]=useState(false)
  useEffect(() => {
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)')
    const update=()=>setEnabled(!preference.matches && !reducedMotion)
    const visibility=()=>setVisible(!document.hidden)
    update();preference.addEventListener('change',update);document.addEventListener('visibilitychange',visibility)
    return()=>{preference.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility)}
  },[reducedMotion])
  if(!enabled || lost)return null
  return <ButterflyBoundary><div className="golden-butterfly-overlay" aria-hidden="true" style={{zIndex}}>
    <Canvas orthographic camera={{position:[0,0,1000],zoom:1,near:.1,far:2000}} frameloop={visible ? 'always' : 'never'} dpr={[1,1.5]} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} fallback={null} onCreated={({gl})=>{gl.setClearColor(0x000000,0);gl.domElement.addEventListener('webglcontextlost',()=>setLost(true),{once:true})}}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[150,300,500]} intensity={2.1} color="#fff2d5" />
      <directionalLight position={[-200,-100,200]} intensity={.6} color="#d6e5ef" />
      <ButterflyController {...{size:Math.max(24,Number(size)||120),speed:Math.max(.25,Number(flightSpeed)||1.2),autoFly,autoLand,followCursor,clickInteraction,landingDuration,onLand,flapFrequency:Math.max(1,Math.min(12,flapFrequency)),flapAmplitude:Math.max(0,Math.min(1.05,flapAmplitude)),wingFlex:Math.max(0,Math.min(.3,wingFlex)),turnSensitivity,hoverIntensity}} />
    </Canvas>
  </div></ButterflyBoundary>
}
