import { useRef, useEffect, useCallback } from 'react'

// ==========================================================
// CLICK SPARK - click karne par chingariyan
//
// React Bits ka component (JavaScript + Tailwind wala variant).
// Kahin bhi click karo to us jagah se chhoti chhoti lines
// bahar ki taraf nikalti hain aur gayab ho jati hain
//
// Kaam kaise karta hai:
//   - ek <canvas> poore area par bichha hua hai (pointer-events-none,
//     isliye neeche ke buttons/links normal kaam karte hain)
//   - click par sparkCount jitni lines ka data sparksRef me daal dete hain
//   - requestAnimationFrame har frame par canvas saaf karke unhe
//     dobara draw karta hai, aur duration khatam hote hi hata deta hai
//
// Sparks ko useState me nahi rakha - har frame par setState karne se
// React 60 baar/second re-render karta. Ref me rakhne se React ko
// pata hi nahi chalta, sab kuch canvas par hota hai
// ==========================================================
const ClickSpark = ({
  sparkColor = '#fff',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1.0,
  children,
}) => {
  const canvasRef = useRef(null)
  const sparksRef = useRef([])
  const startTimeRef = useRef(null)

  // Canvas ka size = viewport ka size (screen jitna), poore page
  // jitna nahi.
  //
  // Original component me canvas parent ke barabar hota hai. Yahan
  // parent poora landing page hai (~5000px lamba), to canvas
  // 1265x5077 ka ban jata tha - 24.5 MB ka bitmap, aur har frame
  // par 6.4 million pixel clear karne padte the. Wo bhi hamesha,
  // kyunki requestAnimationFrame kabhi rukta nahi
  //
  // Canvas fixed hai (screen par chipka hua), isliye uska apna
  // getBoundingClientRect hi viewport ka naap de deta hai
  //
  // Dikhne me koi farak nahi: spark wahin banti hai jahan click
  // kiya, aur 420ms me khatam ho jati hai - itni der me scroll
  // karne ka sawaal hi nahi
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let resizeTimeout

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect()
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    }

    // Resize par turant nahi, 100ms ruk kar - warna drag karte waqt
    // canvas sau baar dobara bana karta hai (mehnga kaam hai)
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resizeCanvas, 100)
    }

    // Canvas khud ko observe karte hain - fixed inset-0 hone ki wajah
    // se ye viewport ke saath hi resize hota hai
    const ro = new ResizeObserver(handleResize)
    ro.observe(canvas)

    resizeCanvas()

    return () => {
      ro.disconnect()
      clearTimeout(resizeTimeout)
    }
  }, [])

  const easeFunc = useCallback(
    (t) => {
      switch (easing) {
        case 'linear':
          return t
        case 'ease-in':
          return t * t
        case 'ease-in-out':
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        default:
          return t * (2 - t)
      }
    },
    [easing],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let animationId

    const draw = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // filter se do kaam ek saath: purani sparks hata dena aur
      // baaki ko draw karna
      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime
        if (elapsed >= duration) {
          return false
        }

        const progress = elapsed / duration
        const eased = easeFunc(progress)

        // Spark jitna door jata hai utna hi chhota hota jata hai
        const distance = eased * sparkRadius * extraScale
        const lineLength = sparkSize * (1 - eased)

        const x1 = spark.x + distance * Math.cos(spark.angle)
        const y1 = spark.y + distance * Math.sin(spark.angle)
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle)
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle)

        ctx.strokeStyle = sparkColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        return true
      })

      animationId = requestAnimationFrame(draw)
    }

    animationId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration, easeFunc, extraScale])

  const handleClick = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const now = performance.now()

    // Saari lines ek hi point se, barabar angle par - ek poora circle
    const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / sparkCount,
      startTime: now,
    }))

    sparksRef.current.push(...newSparks)
  }

  return (
    <div className="relative w-full h-full" onClick={handleClick}>
      {/* fixed inset-0 = screen par chipka hua, viewport jitna bada.
          pointer-events-none isliye ki neeche ke buttons/links par
          click normal tarike se pahunche.
          z-0 = positioned element hai, isliye ye normal content ke
          UPAR paint hota hai (sparks har jagah dikhti hain) par
          navbar ke neeche rehta hai, kyunki navbar z-50 par hai

          w-full h-full zaroori hai: canvas ek "replaced element" hai
          (img jaisa), aur CSS ke hisaab se fixed/absolute replaced
          element ki auto width insets se nahi, uske apne intrinsic
          size se aati hai. Sirf inset-0 lagane par canvas apne default
          300x150 par hi ateka reh gaya tha */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 block w-full h-full select-none pointer-events-none"
      />
      {children}
    </div>
  )
}

export default ClickSpark
