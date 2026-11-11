import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { wingPose } from './butterflyMotion.js'

function makeWing(rear) {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  if (rear) {
    shape.bezierCurveTo(20, 15, 62, 28, 84, 10)
    shape.bezierCurveTo(98, -2, 91, -13, 87, -20)
    shape.bezierCurveTo(87, -29, 77, -30, 73, -37)
    shape.bezierCurveTo(62, -40, 61, -46, 49, -43)
    shape.bezierCurveTo(24, -43, 8, -22, 0, 0)
  } else {
    shape.bezierCurveTo(10, 32, 28, 72, 62, 84)
    shape.bezierCurveTo(77, 91, 86, 78, 87, 66)
    shape.bezierCurveTo(91, 59, 100, 52, 98, 42)
    shape.bezierCurveTo(106, 30, 96, 18, 89, 10)
    shape.bezierCurveTo(69, -12, 24, -20, 0, 0)
  }
  // Subdivide once at creation so curvature has interior vertices, never per frame.
  const outlineGeometry = new THREE.ShapeGeometry(shape, 40)
  let geometry = outlineGeometry.toNonIndexed()
  outlineGeometry.dispose()
  for (let pass = 0; pass < 2; pass++) {
    const src = geometry.attributes.position.array, vertices = []
    for (let i = 0; i < src.length; i += 9) {
      const a = Array.from(src.slice(i,i+3)), b = Array.from(src.slice(i+3,i+6)), c = Array.from(src.slice(i+6,i+9))
      const ab = a.map((v,j)=>(v+b[j])/2), bc = b.map((v,j)=>(v+c[j])/2), ca = c.map((v,j)=>(v+a[j])/2)
      vertices.push(...a,...ab,...ca,...ab,...b,...bc,...ca,...bc,...c,...ab,...bc,...ca)
    }
    geometry.dispose()
    geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2))
  }
  geometry.computeBoundingBox()
  const { min, max } = geometry.boundingBox
  const width = max.x - min.x, height = max.y - min.y
  const positions = geometry.attributes.position, uv = geometry.attributes.uv
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i)
    uv.setXY(i, (x - min.x) / width, (y - min.y) / height)
    positions.setZ(i, 4 * Math.sin(x / width * Math.PI) * Math.sin((y - min.y) / height * Math.PI))
  }
  geometry.computeVertexNormals()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')
  const point = p => [(p.x - min.x) / width * 512, (1 - (p.y - min.y) / height) * 512]
  const outline = shape.getPoints(100).map(point)
  ctx.beginPath()
  outline.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y))
  ctx.closePath()
  const gold = ctx.createLinearGradient(0, 512, 512, 0)
  gold.addColorStop(0, '#071e38'); gold.addColorStop(.22, '#105380'); gold.addColorStop(.48, '#248dc5'); gold.addColorStop(.72, '#77cbe5'); gold.addColorStop(1, '#1c4f83')
  ctx.fillStyle = gold; ctx.fill()
  ctx.strokeStyle = '#111b2b'; ctx.lineWidth = 38; ctx.stroke()
  const origin = point(new THREE.Vector2(0,0))
  for (let i = 12; i < outline.length - 8; i += 13) {
    const [x,y] = outline[i]
    ctx.beginPath(); ctx.moveTo(...origin)
    ctx.quadraticCurveTo(x * .55, origin[1] * .5 + y * .5, x, y)
    ctx.strokeStyle = '#163952'; ctx.lineWidth = 3.5; ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x * .66, origin[1] * .34 + y * .66)
    const next = outline[Math.min(i + 7, outline.length - 1)]
    ctx.lineTo(next[0], next[1]); ctx.lineWidth = 1.3; ctx.stroke()
  }
  // Fine deterministic scales and irregular marginal marks.
  let seed = rear ? 71 : 113
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  for (let i = 0; i < 8500; i++) {
    ctx.fillStyle = i % 2 ? '#d2f7ff24' : '#071a3822'
    ctx.fillRect(random()*512, random()*512, 1, 2)
  }
  for (let i = 15; i < outline.length - 8; i += 11) {
    const [x,y] = outline[i]
    ctx.fillStyle = '#c4e3eb'; ctx.beginPath(); ctx.ellipse(x*.93+origin[0]*.07, y*.93+origin[1]*.07, 4, 7, -.4, 0, Math.PI*2); ctx.fill()
  }
  for (const [x,y,r] of (rear ? [[345,320,23],[275,410,15]] : [[335,155,16]])) {
    for (const [scale,color] of [[1,'#5d9eb8'],[.73,'#102039'],[.3,'#94c6d7']]) {
      ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r*scale,0,Math.PI*2);ctx.fill()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return { geometry, texture }
}

function Wing({ side, rear, motion, options, asset }) {
  const pivot = useRef()
  const pose = useRef({ fold:.5, pitch:0, flex:0 })
  const uniforms = useRef({ wingBend: { value:0 } })
  const shader = useMemo(() => program => {
    program.uniforms.wingBend = uniforms.current.wingBend
    program.vertexShader = 'uniform float wingBend;\n' + program.vertexShader
    // Cylindrical bending preserves span length and fixes the root at x=0.
    program.vertexShader = program.vertexShader.replace('#include <beginnormal_vertex>', `
      #include <beginnormal_vertex>
      float bendAngle = wingBend * position.x / 100.0;
      objectNormal = mat3(cos(bendAngle),0.0,sin(bendAngle),0.0,1.0,0.0,-sin(bendAngle),0.0,cos(bendAngle)) * objectNormal;
    `).replace('#include <begin_vertex>', `
      #include <begin_vertex>
      float k = wingBend / 100.0;
      if (abs(k) > 0.00001) {
        float a = k * position.x;
        transformed.x = sin(a)/k - position.z*sin(a);
        transformed.z = (1.0-cos(a))/k + position.z*cos(a);
      }
    `)
  }, [uniforms])
  useFrame(() => {
    const p = wingPose(motion.current, side, rear, options, pose.current)
    pivot.current.rotation.set(p.pitch, -side*p.fold, side*p.pitch*.3)
    uniforms.current.wingBend.value = p.flex
  })
  // Bury both mirrored hinges inside the thorax volume. The previous roots
  // sat behind its surface, exposing a gap when the near wing turned edge-on.
  return <group ref={pivot} position={[side*.6, rear ? -3 : 2, rear ? 3.8 : 1.5]}>
    {/* Sweep the hindwing toward the abdomen within the flap pivot. The root
        stays attached, while the upper edge clears the forewing's membrane. */}
    <mesh geometry={asset.geometry} scale={[side,1,1]} rotation={[0,0,rear ? -side*.4 : 0]}>
      <meshPhysicalMaterial map={asset.texture} onBeforeCompile={shader} side={THREE.DoubleSide} roughness={.48} metalness={.08} iridescence={.45} iridescenceIOR={1.3} iridescenceThicknessRange={[160,360]} />
    </mesh>
  </group>
}

function Filament({ points, radius = .35, motion, side = 1, antenna = false }) {
  const pivot = useRef()
  useFrame(() => {
    if (!motion || !pivot.current) return
    const m = motion.current
    pivot.current.rotation.x = antenna ? Math.sin(m.time*.7+side)*.018 : (1-m.legExtension)*.48
    pivot.current.rotation.z = antenna ? Math.sin(m.time*.5+side)*.012 : side*(1-m.legExtension)*.12
  })
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), [points])
  return <group ref={pivot} position={points[0]}><mesh position={points[0].map(v => -v)}><tubeGeometry args={[curve,16,radius,5,false]} /><meshStandardMaterial color="#30251c" roughness={.9} /></mesh></group>
}

export default function ButterflyModel({ motion, options }) {
  const assets = useMemo(() => [makeWing(false),makeWing(true)], [])
  useEffect(() => () => assets.forEach(a => { a.geometry.dispose(); a.texture.dispose() }), [assets])
  // Right three-quarter view reveals the far pair behind the near pair.
  return <group rotation={[0, -.65, 0]}>
    {[-1,1].flatMap(side => [false,true].map(rear => <Wing key={`${side}-${rear}`} side={side} rear={rear} motion={motion} options={options} asset={assets[rear ? 1 : 0]} />))}
    {[0,1,2,3,4,5,6].map(i => <mesh key={i} position={[0,-7-i*4.3,2]} scale={[1,.8,1]}>
      <sphereGeometry args={[3.6-i*.32,12,8]} /><meshStandardMaterial color={i%2 ? '#493021' : '#291e16'} roughness={.9} />
    </mesh>)}
    <mesh position={[0,2,3]} scale={[1,1.65,1]}><sphereGeometry args={[4.7,16,12]} /><meshStandardMaterial color="#3c2a1d" roughness={1} /></mesh>
    <mesh position={[0,12,3]}><sphereGeometry args={[3.5,16,12]} /><meshStandardMaterial color="#35261b" /></mesh>
    {[-1,1].map(side => <group key={side}>
      <mesh position={[side*2.8,13,5]}><sphereGeometry args={[1.55,12,8]} /><meshStandardMaterial color="#0f100c" roughness={.25} /></mesh>
      <Filament points={[[side*1.5,15,3],[side*5,26,4],[side*12,35,3],[side*15,34,3]]} />
      <mesh position={[side*15,34,3]} scale={[.7,1.5,.7]}><sphereGeometry args={[.8,8,6]} /><meshStandardMaterial color="#241b14" /></mesh>
      {[0,1,2].map(i => <Filament key={i} motion={motion} side={side} radius={.28} points={[[side*3,3-i*4,1],[side*10,5-i*6,-3],[side*15,-2-i*7,-5],[side*17,-4-i*7,-4]]} />)}
    </group>)}
  </group>
}



