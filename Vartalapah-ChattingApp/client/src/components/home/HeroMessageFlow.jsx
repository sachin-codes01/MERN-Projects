import { useEffect, useRef, useState } from 'react'
import PersonIcon from '@mui/icons-material/Person'
import ImageIcon from '@mui/icons-material/Image'
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'
import DoneAllIcon from '@mui/icons-material/DoneAll'

// ==========================================================
// HERO ME TAIRTE HUE MESSAGE (sirf desktop / lg+ par)
//
// Naam "Vārtālāpaḥ" ke UPAR ki khali jagah me chhote message
// bubbles neeche se upar uthte hain aur ghul jate hain. Dikhne me
// wahi cheezein jo asli chat me hoti hain - text, photo, video,
// emoji, typing dots aur seen wala tick.
//
// Teen baatein khaas hain:
//   1. Bubbles ek jagah se nahi nikalte - naam ki poori chaudai
//      ko lanes me baant diya hai, har lane ka apna bubble hai.
//      Har chakkar ke baad uski x-position lane ke andar hi badal
//      jati hai, isliye jagah har baar nayi lagti hai. Lane alag
//      alag hain, to do bubble kabhi ek dusre par nahi chadhte.
//   2. Peeche jo bada "08" hai uske upar bubble kabhi nahi chadhta.
//      Jo lane us number ke neeche padti hai wo utni hi upar jati
//      hai jitni jagah number ke neeche bachi hai - aur jagah kam
//      ho to wo lane banti hi nahi.
//   3. Choti screen (chhoti lambai wali laptop) par number ke neeche
//      jagah hi nahi bachti. Aisi haalat me sirf number ke BAAYEIN
//      wali khali patti me bubbles chalte hain, aur wo bhi na bane
//      to animation dikhti hi nahi - kuch bhi takrata nahi
//
// Sab naap browser se hi liye jate hain (naam kitna chauda hai,
// number ki asli syaahi kahan khatam hoti hai) - isliye screen
// size badle to hisaab apne aap sudhar jata hai.
// ==========================================================

// Title ke upar itni khali jagah chhodni hai - bubble yahin se
// fade-in hota hai, naam ko chhuta nahi
const GAP_ABOVE_TITLE = 28

// Ek bubble kam se kam / zyada se zyada itna upar uthega
const MIN_RISE = 60
const MAX_RISE = 200

// Screen ke bilkul upar tak nahi jayenge
const SAFE_TOP = 56

// Bade "08" se itni doori (upar aur baayein dono taraf)
const NUMBER_GAP_Y = 14
const NUMBER_GAP_X = 16

// Lane itni chaudi honi hi chahiye ki poora message card (avatar +
// text) usme aa jaye - warna sirf chhote icon wale chips bachte hain
// aur "message" wali baat hi khatam ho jati hai
const MIN_LANE = 175
const MAX_LANES = 3

// Itni jagah se message na nikal rahe hon to dobara baant kar dekhte hain
const ENOUGH_LANES = 2

// Ek lane me do message chal sakte hain - doosra aadha chakkar peeche
// shuru hota hai. Uthne ka curve symmetric hai (dekho index.css),
// isliye dono ke beech ka faasla kabhi aadhe rise se kam nahi hota.
// Us faasle me bubble (44px) aaram se aa jaye, isliye 60px maanga hai
const MIN_STACK_GAP = 60
const MAX_PER_LANE = 2

// Message kitni tezi se upar uthein (pixel/second)
const SPEED_MIN = 50
const SPEED_MAX = 68
const MIN_DURATION = 2.6
const MAX_DURATION = 4.4

// Bubble ke roop aur naap wahi hain jo "delivered instantly" wale
// section ke chips ke hain. Zyadatar me sach me likha hua message hai,
// beech beech me photo/video/emoji/tick wale chhote chips.
//
// DHYAN: har shape ki height EK JAISI (44) rakhi hai. Pehle card 48 ka
// tha aur icon 44 ka - jagah tang hone par sirf 4px ke farak se card
// chhant jate the aur screen par sirf icon bachte the. Ab dono ek saath
// chalte hain ya dono nahi
const SHAPES = [
  { kind: 'text', text: "Let's talk 👋", h: 44 },
  { kind: 'text', text: "That's great!", solid: true, h: 44 },
  { kind: 'text', text: 'I like that 😄', h: 44 },
  { kind: 'image', w: 44, h: 44 },
  { kind: 'text', text: "Can't wait 🎉", solid: true, h: 44 },
  { kind: 'text', text: 'Hey there!', h: 44 },
  { kind: 'text', text: 'Me too ❤️', solid: true, h: 44 },
  { kind: 'video', w: 44, h: 44 },
  { kind: 'text', text: "That's cool!", h: 44 },
  { kind: 'text', text: 'Thanks! 🙌', solid: true, h: 44 },
  { kind: 'text', text: 'Haha 😄', h: 44 },
  { kind: 'emoji', emoji: '😍', w: 44, h: 44 },
  { kind: 'text', text: 'Nice one 👌', solid: true, h: 44 },
  { kind: 'text', text: 'See you! 👋', h: 44 },
  { kind: 'text', text: 'On my way!', solid: true, h: 44 },
  { kind: 'check', w: 44, h: 44 },
]

// Text wale bubble me: padding + avatar + gap + padding + border.
// Text ki apni chaudai canvas se naapte hain (neeche)
const TEXT_CHROME = 66
const TEXT_FONT = '14px system-ui, "Segoe UI", Roboto, Arial, sans-serif'

const rand = (min, max) => min + Math.random() * (max - min)

// Halka sa daayein-baayein bahav (5-15px), dono taraf ho sakta hai.
// Lane ke andar itni jagah chhodi hai (LANE_PAD) ki bahne ke baad bhi
// bubble apni lane me hi rahe
const randDrift = () => (Math.random() < 0.5 ? -1 : 1) * rand(5, 15)

// Lane ke dono kinaron par khali jagah
const LANE_PAD = 12

// Lane ke andar bubble ki nayi shuruaati jagah.
// Kinare par thodi jagah chhodte hain taaki drift ke baad bhi
// bubble apni hi lane me rahe
// realWidth = render hone ke baad ki asli chaudai (agar mil chuki ho),
// warna canvas wala andaza
const randX = (lane, realWidth) => {
  const w = realWidth || lane.shape.w
  const min = lane.left + LANE_PAD
  const max = lane.left + lane.width - w - LANE_PAD
  return max <= min ? min : rand(min, max)
}

// List ko phent dete hain (Fisher-Yates)
const shuffled = (count) => {
  const list = [...Array(count).keys()]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

// ----------------------------------------------------------
// Text wale bubbles kitne chaude honge
// Element ki apni chaudai text ke hisaab se banti hai (max-content),
// lekin lane ka hisaab lagane ke liye number pehle chahiye - isliye
// canvas se naap lete hain aur thoda margin jod dete hain
// ----------------------------------------------------------
const withWidths = () => {
  let ctx = null
  try {
    ctx = document.createElement('canvas').getContext('2d')
  } catch {
    ctx = null
  }

  const textWidth = (text, font, perChar) => {
    if (!ctx) return text.length * perChar
    ctx.font = font
    return ctx.measureText(text).width
  }

  return SHAPES.map((shape) =>
    shape.kind === 'text'
      ? { ...shape, w: Math.ceil(textWidth(shape.text, TEXT_FONT, 8)) + TEXT_CHROME }
      : shape,
  )
}

// ----------------------------------------------------------
// Peeche wale bade "08" ki ASLI syaahi kahan hai
//
// Element ka box (256px) glyph se kaafi bada hota hai - box ke
// hisaab se chalein to bubbles ko bewajah bahut neeche rakhna padta.
// Canvas se text ke actual bounds nikal lete hain
// ----------------------------------------------------------
const numberInk = (el) => {
  const rect = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  const size = parseFloat(cs.fontSize) || 0

  // Naap na mile to box se hi mota-mota andaza
  const fallback = { left: rect.left + size * 0.05, bottom: rect.bottom - size * 0.2 }

  try {
    const ctx = document.createElement('canvas').getContext('2d')
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    const m = ctx.measureText(el.textContent.trim())

    const lineHeight = parseFloat(cs.lineHeight) || size
    const halfLeading = (lineHeight - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2
    const baseline = rect.top + halfLeading + m.fontBoundingBoxAscent

    const left = rect.left - m.actualBoundingBoxLeft
    const bottom = baseline + m.actualBoundingBoxDescent

    return Number.isFinite(left) && Number.isFinite(bottom) ? { left, bottom } : fallback
  } catch {
    return fallback
  }
}

// ----------------------------------------------------------
// Di hui chaudai ko lanes me baant kar har lane ka bubble banate hain
// originX = ye patti screen par kahan se shuru hoti hai
// floorY  = bubbles kis line se uthenge (naam se thoda upar)
// ----------------------------------------------------------
const buildLanes = ({ originX, width, floorY, ink, minLane, shapes }) => {
  // Kam se kam 1 lane. Pehle yahan 2 ka minimum tha - us wajah se chhoti
  // chaudai par do patli lanes ban jati thin jisme message card aata hi
  // nahi tha, aur sirf chhote icon wale chips dikhte the. Ek chaudi lane
  // do tang lanes se behtar hai
  const count = Math.max(1, Math.min(MAX_LANES, Math.floor(width / minLane)))
  const laneWidth = width / count

  // Delay ke liye lanes ka order phent dete hain, warna bubbles
  // baayein se daayein line se aate hue lagte hain
  const order = shuffled(count)
  const lanes = []
  let pick = Math.floor(Math.random() * shapes.length)

  order.forEach((laneIndex, turn) => {
    const left = laneIndex * laneWidth

    // Ye lane bade "08" ke neeche aati hai kya?
    const underNumber = originX + left + laneWidth > ink.left - NUMBER_GAP_X

    // Chhat: number wali lane number se neeche hi rukegi.
    // Bubble ki height ghata kar chalte hain kyunki chhat bubble ke
    // UPAR wale kinare par lagti hai - warna bubble ka sir number me
    // ghus jata
    const ceiling = underNumber ? Math.max(SAFE_TOP, ink.bottom + NUMBER_GAP_Y) : SAFE_TOP
    const headroom = floorY - ceiling

    // Is lane me jo bubble aaram se sama jaye wahi chunte hain -
    // chaudai me dono taraf ki padding ke baad bhi thodi jagah bachni
    // chahiye (taaki har chakkar me x thoda alag ho sake), aur oonchai
    // me itni jagah ki wo dhang se upar uth sake
    const fits = shapes.filter(
      (s) => s.w + LANE_PAD * 2 + 6 <= laneWidth && headroom - s.h >= MIN_RISE,
    )
    if (!fits.length) return

    // Chunav ka pakka kram: DO likhe hue message, phir EK photo/video/
    // emoji/tick wala chip - aur phir se wahi. Isse dono cheezein hamesha
    // saath dikhti hain (na sirf icon, na sirf text), aur chips bhi
    // baari baari se badalte rehte hain.
    // Bina is kram ke chunav kismat par tha aur screen par kabhi sirf
    // icon, kabhi sirf text reh jata tha
    const cards = fits.filter((s) => s.kind === 'text')
    const chips = fits.filter((s) => s.kind !== 'text')
    const pool = !cards.length
      ? chips
      : !chips.length
        ? cards
        : cards.flatMap((card, i) =>
            i % 2 === 1 ? [card, chips[Math.floor(i / 2) % chips.length]] : [card],
          )

    // Jitni oonchai hai utne message ek lane me chalte hain.
    // Sabka rise ek hi rakhte hain, warna beech ka faasla pakka nahi rehta
    const first = pool[pick % pool.length]
    const chosen = [first]
    let rise = Math.round(Math.min(MAX_RISE, headroom - first.h))

    for (let n = 1; n < Math.min(MAX_PER_LANE, Math.floor(rise / MIN_STACK_GAP)); n++) {
      chosen.push(pool[(pick + n) % pool.length])
    }

    // Sabse oonche card ke hisaab se rise dobara nikalte hain, aur us
    // nayi rise me jitne message theek se sama sakein utne hi rakhte hain
    rise = Math.round(Math.min(MAX_RISE, headroom - Math.max(...chosen.map((s) => s.h))))
    chosen.length = Math.max(1, Math.min(chosen.length, Math.floor(rise / MIN_STACK_GAP)))
    const perLane = chosen.length

    // Rafter fix hai, isliye lamba safar zyada der leta hai - chhota
    // safar apne aap jaldi khatam. Har lane ki apni halki si alag speed
    const duration = Math.min(
      MAX_DURATION,
      Math.max(MIN_DURATION, rise / rand(SPEED_MIN, SPEED_MAX)),
    )

    // Ek ke baad ek aate hain, sab ek saath nahi
    const baseDelay = (turn / count) * 1.8 + rand(0, 0.4)

    pick += perLane

    for (let n = 0; n < perLane; n++) {
      const shape = chosen[n]

      const lane = {
        shape,
        left,
        width: laneWidth,
        rise,
        drift: randDrift(),
        duration,
        delay: baseDelay + (n * duration) / perLane,
      }

      lane.x = randX(lane)
      lanes.push(lane)
    }
  })

  return lanes
}

// ----------------------------------------------------------
// Ek bubble ke andar kya dikhega
// Rang, border aur radius wahi hain jo baaki site ke chips me hain
// ----------------------------------------------------------
const Bubble = ({ shape }) => {
  const panel = 'w-full h-full bg-app-panel border border-app-border shadow-lg flex items-center justify-center'

  if (shape.kind === 'text') {
    return (
      <span
        className={`w-full h-full flex items-center gap-2 rounded-2xl pl-2 pr-3.5 shadow-lg ${
          shape.solid ? 'brand-gradient shadow-brand/30' : 'bg-app-panel border border-app-border'
        }`}
      >
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            shape.solid ? 'bg-white/20 text-white' : 'brand-gradient text-white'
          }`}
        >
          <PersonIcon sx={{ fontSize: 18 }} />
        </span>
        <span
          className={`plain-text text-sm whitespace-nowrap ${
            shape.solid ? 'text-white' : 'text-app-text'
          }`}
        >
          {shape.text}
        </span>
      </span>
    )
  }

  if (shape.kind === 'emoji') {
    return <span className={`${panel} rounded-xl text-xl`}>{shape.emoji}</span>
  }

  if (shape.kind === 'image') {
    return (
      <span className={`${panel} rounded-xl text-brand-light`}>
        <ImageIcon sx={{ fontSize: 22 }} />
      </span>
    )
  }

  if (shape.kind === 'video') {
    return (
      <span className="w-full h-full brand-gradient text-white rounded-xl shadow-lg shadow-brand/30 flex items-center justify-center">
        <PlayCircleFilledIcon sx={{ fontSize: 24 }} />
      </span>
    )
  }

  // 'check' - message seen wala dohra tick
  return (
    <span className={`${panel} rounded-xl text-brand-light`}>
      <DoneAllIcon sx={{ fontSize: 20 }} />
    </span>
  )
}

// ----------------------------------------------------------
// MAIN COMPONENT
// titleRef  -> <h1> jisme website ka naam hai
// numberRef -> peeche wala bada mahine ka number
// ----------------------------------------------------------
const HeroMessageFlow = ({ titleRef, numberRef }) => {
  // null = kuch render nahi karna (chhoti screen, ya jagah hi nahi bachi)
  const [geo, setGeo] = useState(null)

  // Text/emoji bubble ki asli chaudai render hone ke baad hi pata chalti
  // hai (canvas wala naap sirf andaza tha). Use yahan sambhal lete hain
  // taaki agli baar jagah badalte waqt hisaab bilkul sahi rahe
  const realWidths = useRef([])

  useEffect(() => {
    let timer = 0

    const measure = () => {
      const title = titleRef.current
      const number = numberRef.current

      // Tablet/mobile par ye animation hai hi nahi - wahan sab kuch
      // bilkul pehle jaisa rehta hai
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches
      const stillMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (!title || !number || !isDesktop || stillMotion) {
        setGeo(null)
        return
      }

      // Naam ki asli chaudai (h1 ka box poore column jitna chauda hai,
      // isliye box nahi - text ka apna naap chahiye)
      const range = document.createRange()
      range.selectNodeContents(title)
      const textRect = range.getBoundingClientRect()
      const titleRect = title.getBoundingClientRect()
      const width = textRect.width

      if (width < 180) {
        setGeo(null)
        return
      }

      // Yahan se bubbles uthte hain - naam se GAP_ABOVE_TITLE upar
      const floorY = titleRect.top - GAP_ABOVE_TITLE
      const ink = numberInk(number)
      const shapes = withWidths()
      const common = { originX: textRect.left, floorY, ink, shapes }

      // Lane itni chaudi honi chahiye ki sabse chauda message card usme
      // aaram se aa jaye - warna wo chhant jata hai aur sirf icon wale
      // chhote chips bachte hain
      const widestCard = Math.max(
        ...shapes.filter((s) => s.kind === 'text').map((s) => s.w),
        MIN_LANE - LANE_PAD * 2 - 6,
      )

      const cardLane = widestCard + LANE_PAD * 2 + 6

      // Pehla plan: naam ki poori chaudai
      let lanes = buildLanes({ ...common, width, minLane: cardLane })

      // Kitni ALAG ALAG jagah se message nikal rahe hain.
      // lanes.length nahi chalega - ek hi lane me do message ho sakte
      // hain, aur do message ek hi jagah se nikalna "alag jagah" nahi hai
      const spots = (list) => new Set(list.map((l) => l.left)).size

      // Number ke neeche jagah na bachi ho to lanes gir jati hain. Aise me
      // sirf number ke BAAYEIN wali khali patti me dobara baant kar dekhte
      // hain - agar usse zyada jagah se message nikal sakein to wahi sahi
      if (spots(lanes) < ENOUGH_LANES) {
        const clearWidth = Math.min(width, ink.left - NUMBER_GAP_X - textRect.left)
        if (clearWidth >= cardLane) {
          const retry = buildLanes({ ...common, width: clearWidth, minLane: cardLane })
          const laneW = (list) => list[0]?.width || 0

          // Zyada jagah se message nikal rahe hon to accha. Utni hi jagah
          // se nikal rahe hon lekin lane chaudi ho to bhi accha - x har
          // chakkar me zyada door tak badal sakta hai
          if (
            spots(retry) > spots(lanes) ||
            (spots(retry) === spots(lanes) && laneW(retry) > laneW(lanes))
          ) {
            lanes = retry
          }
        }
      }

      // Ek bhi message na bane to animation hai hi nahi
      if (!lanes.length) {
        setGeo(null)
        return
      }

      // Nayi lanes = purani chaudaiyan bekaar
      realWidths.current = []

      const height = Math.max(...lanes.map((l) => l.rise + l.shape.h))
      setGeo({ width, height, lanes })
    }

    // resize par har pixel pe naapna fizool hai - haath rukne ka
    // intezaar karke ek hi baar naapte hain
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(measure, 140)
    }

    measure()

    // Custom fonts swap se aate hain - unke aane par naam ki chaudai
    // badal jati hai, isliye tab dobara naapte hain
    document.fonts?.ready.then(measure).catch(() => {})

    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [titleRef, numberRef])

  if (!geo) return null

  // Har chakkar ke baad bubble ki jagah aur bahav badal dete hain.
  // Us waqt bubble poori tarah transparent hota hai, isliye ye
  // badlav kabhi dikhta nahi
  const onIteration = (lane, i) => (e) => {
    // Har bubble par do animation chalti hain (uthna aur ghulna), aur
    // dono ka chakkar ek saath poora hota hai - jagah sirf ek baar
    // badalni hai, isliye ek hi animation par kaam karte hain
    if (e.animationName && !e.animationName.includes('hero-msg-rise')) return

    const el = e.currentTarget
    realWidths.current[i] = el.offsetWidth
    el.style.left = `${randX(lane, realWidths.current[i])}px`
    el.style.setProperty('--hero-msg-drift', `${randDrift()}px`)
  }

  return (
    <div
      aria-hidden="true"
      // bottom: 100% + gap  ->  ye poora dabba naam ke thik upar baithta hai
      className="hero-msg-flow hidden lg:block absolute left-0 pointer-events-none"
      style={{
        bottom: `calc(100% + ${GAP_ABOVE_TITLE}px)`,
        width: `${geo.width}px`,
        height: `${geo.height}px`,
      }}
    >
      {geo.lanes.map((lane, i) => (
        <span
          key={i}
          className="hero-msg"
          onAnimationIteration={onIteration(lane, i)}
          style={{
            left: `${lane.x}px`,
            // text wale bubble apni chaudai khud tay karte hain
            // (text jitni chahiye), baaki sabki naap fix hai
            width: lane.shape.kind === 'text' ? 'max-content' : `${lane.shape.w}px`,
            height: `${lane.shape.h}px`,
            animationDuration: `${lane.duration}s`,
            animationDelay: `${lane.delay}s`,
            '--hero-msg-rise': `${lane.rise}px`,
            '--hero-msg-drift': `${lane.drift}px`,
          }}
        >
          <Bubble shape={lane.shape} />
        </span>
      ))}
    </div>
  )
}

export default HeroMessageFlow
