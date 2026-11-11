import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import ButterflyModel from './ButterflyModel.jsx'
import { advanceWingMotion, smooth } from './butterflyMotion.js'

// States: IDLE, FLYING, APPROACHING, LANDING, RESTING, TAKEOFF.
const clamp = THREE.MathUtils.clamp

export default function ButterflyController({ size, speed, autoFly, autoLand, followCursor, clickInteraction, landingDuration, onLand, flapFrequency, flapAmplitude, wingFlex, turnSensitivity, hoverIntensity }) {
  const group = useRef()
  const options = { flapFrequency, flapAmplitude, wingFlex }
  const orientation = useRef(new THREE.Quaternion())
  const angles = useRef(new THREE.Euler())
  const { size: viewport } = useThree()
  const input = useRef({ cursor: null, click: null, lastApproach: -20 })
  const motion = useRef({ state:'IDLE', time:0, until:1, elapsed:0, duration:1, element:null, initialized:false,
    curve:new THREE.CubicBezierCurve3(), previous:new THREE.Vector3(), tangent:new THREE.Vector3(0,1,0), bank:0, phase:0, activity:0, legExtension:1 })
  useEffect(() => {
    const pointer = e => { if(e.pointerType !== 'touch') input.current.cursor = { x:e.clientX, y:e.clientY } }
    const click = e => { if(clickInteraction) input.current.click = { x:e.clientX, y:e.clientY } }
    const leave = () => { input.current.cursor = null }
    window.addEventListener('pointermove', pointer, { passive:true })
    window.addEventListener('click', click, { passive:true })
    document.addEventListener('pointerleave', leave)
    return () => { window.removeEventListener('pointermove',pointer);window.removeEventListener('click',click);document.removeEventListener('pointerleave',leave) }
  }, [clickInteraction])

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta,.05), m = motion.current, g = group.current
    m.time += dt
    const visualSize = Math.min(size, viewport.width*.23, viewport.height*.23)
    const margin = visualSize*.65 + 10
    const halfW = viewport.width/2, halfH = viewport.height/2
    const limit = v => v.set(clamp(v.x,-Math.max(0,halfW-margin),Math.max(0,halfW-margin)),clamp(v.y,-Math.max(0,halfH-margin),Math.max(0,halfH-margin)),0)
    const fromDOM = (x,y) => limit(new THREE.Vector3(x-halfW,halfH-y,0))
    const perch = element => {
      if (!element?.isConnected || !element.getClientRects().length) return null
      const r = element.getBoundingClientRect()
      const flower = element.dataset.butterflyLand === 'flower'
      const coreX = Number(element.dataset.butterflyCoreX ?? .5)
      const coreY = Number(element.dataset.butterflyCoreY ?? .48)
      const x = r.left + r.width*(flower ? coreX : .72)
      const y = flower ? r.top + r.height*coreY : r.top - visualSize*.15
      if(r.width < 16 || r.height < 8 || x < margin || x > viewport.width-margin || y < margin || y > viewport.height-margin || getComputedStyle(element).visibility === 'hidden') return null
      return fromDOM(x,y)
    }
    const travel = (state, target, duration) => {
      m.state=state;m.elapsed=0;m.duration=duration
      m.curve.v0.copy(g.position);m.curve.v3.copy(limit(target))
      const bend = state === 'LANDING' ? 8 : Math.min(100,g.position.distanceTo(target)*.35)
      m.curve.v1.copy(g.position).lerp(target,.3);m.curve.v1.y+=bend
      m.curve.v2.copy(g.position).lerp(target,.7);m.curve.v2.x+=Math.sin(m.time)*bend
      limit(m.curve.v1);limit(m.curve.v2)
    }
    const takeoff = () => {
      m.element=null
      travel('TAKEOFF',g.position.clone().add(new THREE.Vector3(35,visualSize*.65,0)),1.4/Math.max(.25,speed))
    }
    const choose = () => {
      if(!autoFly){m.state='IDLE';m.until=m.time+1;return}
      const cursor = input.current.cursor
      if(followCursor && cursor && m.time-input.current.lastApproach>12 && Math.random()<.25){
        input.current.lastApproach=m.time;m.element=null
        travel('FLYING',fromDOM(cursor.x+visualSize*.6,cursor.y-visualSize*.5),3/Math.max(.25,speed));return
      }
      const candidates = autoLand ? [...document.querySelectorAll('[data-butterfly-land]')].filter(el => perch(el)) : []
      if(candidates.length && Math.random()<.85){
        const flowers=candidates.filter(el=>el.dataset.butterflyLand==='flower')
        const pool=flowers.length ? flowers : candidates
        m.element=pool[Math.floor(Math.random()*pool.length)]
        const target=perch(m.element);target.y+=visualSize*.5
        travel('APPROACHING',target,3.5/Math.max(.25,speed))
      } else {
        m.element=null
        travel('FLYING',fromDOM(margin+Math.random()*Math.max(0,viewport.width-margin*2),margin+Math.random()*Math.max(0,viewport.height-margin*2)),(3+Math.random()*2)/Math.max(.25,speed))
      }
    }
    if(!m.initialized){g.position.copy(fromDOM(viewport.width*.8,viewport.height*.3));m.initialized=true}
    g.scale.setScalar(visualSize/204)
    // A click while perched first completes takeoff; don't replace the lift
    // curve with a flight curve on the very next frame.
    if(input.current.click && m.state !== 'RESTING' && m.state !== 'TAKEOFF'){const p=input.current.click;input.current.click=null;m.element=null;travel('FLYING',fromDOM(p.x,p.y-visualSize*.35),2/Math.max(.25,speed))}
    if(m.element && !autoLand) takeoff()
    const anchor=m.element ? perch(m.element) : null
    if(m.element && !anchor) takeoff()
    if(m.state==='RESTING'){
      if(anchor && g.position.distanceTo(anchor)>visualSize*.7)takeoff()
      else {
        if(anchor)g.position.lerp(anchor,1-Math.exp(-20*dt))
        if(m.time>=m.until || input.current.click)takeoff()
      }
    } else if(m.state==='IDLE'){
      if(m.time>=m.until)choose()
    } else {
      if(anchor && (m.state==='LANDING'||m.state==='APPROACHING')){
        const destination = anchor.clone()
        if(m.state==='APPROACHING')destination.y+=visualSize*.5
        m.curve.v3.lerp(destination,1-Math.exp(-12*dt))
        limit(m.curve.v3)
      }
      m.elapsed+=dt
      const t=Math.min(1,m.elapsed/m.duration), eased=smooth(m.state === 'TAKEOFF' ? Math.max(0,(t-.18)/.82) : t)
      m.previous.copy(g.position)
      m.curve.getPoint(eased,g.position)
      if(m.state!=='LANDING')g.position.y+=Math.sin(m.time*3)*2*hoverIntensity*Math.sin(Math.PI*t)
      m.curve.getTangent(eased,m.tangent)
      if(t>=1){
        if(m.state==='APPROACHING' && anchor)travel('LANDING',anchor,1.4/Math.max(.25,speed))
        else if(m.state==='LANDING' && anchor){
          m.state='RESTING'
          const duration=m.element.dataset.butterflyLand==='flower' ? Math.max(5000,landingDuration) : landingDuration
          m.until=m.time+clamp(duration,2000,6000)/1000
          try { onLand?.(m.element) } catch (error) { console.warn('Butterfly onLand callback failed:', error) }
        }
        else choose()
      }
    }
    limit(g.position)
    const rest=m.state==='RESTING'||m.state==='IDLE'
    // The model faces +Y. Bounded yaw and bank keep the right oblique view readable.
    const heading = rest ? -.12 : clamp(-Math.atan2(m.tangent.x, Math.max(.25,m.tangent.y)), -1.15, 1.15)
    m.bank = THREE.MathUtils.damp(m.bank, rest ? 0 : clamp((heading-g.rotation.z)*turnSensitivity,-.6,.6),4,dt)
    angles.current.set(rest ? 0 : m.bank*.18, rest ? 0 : m.bank*.28, heading)
    orientation.current.setFromEuler(angles.current)
    g.quaternion.slerp(orientation.current,1-Math.exp(-3*dt))
    advanceWingMotion(m, dt, options)
  }, -1)
  return <group ref={group}><ButterflyModel motion={motion} options={options} /></group>
}

