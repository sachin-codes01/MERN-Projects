import PersonIcon from '@mui/icons-material/Person'
import { messageChips } from '@/constants/homeContent.jsx'

// Do log jo ek dusre ko message bhejte hain
import personLeft from '../../assets/posters/person-left.png'
import personRight from '../../assets/posters/person-right.png'

// ==========================================================
// Ek chip ka style uske "kind" ke hisaab se badalta hai
// Mobile par chhote hain (warna viewport se bahar clip ho jaate the),
// md+ (tablet/PC) par badi size wapas aa jaati hai
//
// Chip ka tairna CSS me hai - index.css me float-lr / float-rl
// ==========================================================
const ChatChip = ({ chip }) => {
  const style = {
    top: chip.top,
    animation: `${chip.anim} ${chip.duration} linear infinite`,
    animationDelay: chip.delay,
  }

  const wrapClass = `floating-chip ${chip.hideOnMobile ? 'hidden md:flex' : 'flex'}`

  if (chip.kind === 'text') {
    return (
      <span
        style={style}
        className={`${wrapClass} items-center gap-1.5 md:gap-2 rounded-2xl pl-1 pr-2.5 py-1.5 md:pl-2 md:pr-3.5 md:py-2 shadow-lg ${
          chip.solid ? 'brand-gradient shadow-brand/30' : 'bg-app-panel border border-app-border'
        }`}
      >
        <span
          className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${
            chip.solid ? 'bg-white/20 text-white' : 'brand-gradient text-white'
          }`}
        >
          <PersonIcon sx={{ fontSize: { xs: 12, md: 18 } }} />
        </span>
        <span className={`plain-text text-[10px] sm:text-xs md:text-sm whitespace-nowrap ${chip.solid ? 'text-white' : 'text-app-text'}`}>
          {chip.text} {chip.emoji}
        </span>
      </span>
    )
  }

  if (chip.kind === 'emoji') {
    return (
      <span
        style={style}
        className={`${wrapClass} w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-xl bg-app-panel border border-app-border items-center justify-center text-sm sm:text-base md:text-xl shadow-lg`}
      >
        {chip.emoji}
      </span>
    )
  }

  if (chip.kind === 'icon') {
    return (
      <span
        style={style}
        className={`${wrapClass} w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-xl items-center justify-center shadow-lg ${
          chip.tone === 'solid'
            ? 'brand-gradient text-white shadow-brand/30'
            : chip.tone === 'heart'
              ? 'bg-app-panel border border-app-border text-red-400'
              : 'bg-app-panel border border-app-border text-brand-light'
        }`}
      >
        {chip.icon}
      </span>
    )
  }

  if (chip.kind === 'dots') {
    return (
      <span
        style={style}
        className={`${wrapClass} w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-xl bg-app-panel border border-app-border items-center justify-center gap-1 shadow-lg`}
      >
        <span className="w-1 h-1 rounded-full bg-app-muted" />
        <span className="w-1 h-1 rounded-full bg-app-muted" />
        <span className="w-1 h-1 rounded-full bg-app-muted" />
      </span>
    )
  }

  // 'plain' - sirf lines wala rectangle bubble, koi text nahi
  return (
    <span
      style={style}
      className={`${wrapClass} items-center gap-1 md:gap-1.5 rounded-2xl px-2.5 py-2 md:px-3.5 md:py-2.5 shadow-lg ${
        chip.tone === 'solid' ? 'brand-gradient shadow-brand/30' : 'bg-app-panel border border-app-border'
      }`}
    >
      <span className={`w-5 md:w-7 h-1.5 md:h-2 rounded-full ${chip.tone === 'solid' ? 'bg-white/30' : 'bg-app-muted/40'}`} />
      <span className={`w-3 md:w-4 h-1.5 md:h-2 rounded-full ${chip.tone === 'solid' ? 'bg-white/30' : 'bg-app-muted/40'}`} />
    </span>
  )
}

// ==========================================================
// TWO PEOPLE, ONE THREAD
//
// md+ (tablet/PC) par dono log left-right kinaron par khade rehte hain
// aur chips + heading unke beech me aati hai. Side ki jagah bas padding
// se banti hai (md:px-[24%]) - images usi padding wali gutter me
// absolute baithti hain
//
// Mobile par layout alag hai: pehle chips, phir dono log, phir heading
// ==========================================================
const TwoPeopleSection = () => (
  <section className="border-t border-b border-app-border py-16 md:py-20 overflow-hidden">
    <div className="max-w-4xl md:max-w-7xl mx-auto px-6 md:px-[24%] lg:px-[23%] xl:px-[20%] md:relative">
      {/* Chhote message/emoji/icon chips + dashed arc - dono logon ke beech
          Chips ki band jaan-boojh kar chhoti rakhi hai - chip ki apni size
          wahi hai, bas unka tairne ka area kam hai (md+ par) */}
      <div className="relative w-full h-28 sm:h-40 md:h-56 lg:h-64 -mb-3 sm:-mb-5 md:-mb-10">
        <svg
          viewBox="0 0 1000 160"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full text-brand/25"
        >
          <path
            d="M 40 150 C 160 30, 340 30, 480 90"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1 14"
          />
          <path
            d="M 520 90 C 660 30, 840 30, 960 150"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1 14"
          />
        </svg>

        {messageChips.map((chip, i) => (
          <ChatChip key={i} chip={chip} />
        ))}
      </div>

      {/* Dono log - mobile par ek row me, md+ par wrapper ki side gutters
          me absolute (isliye row md:static ho jati hai aur collapse ho
          jati hai - dono images wrapper se anchor hoti hain) */}
      <div className="relative flex items-end justify-between gap-4 md:static">
        {/* Boy wali image ke canvas me daayein taraf khali jagah hai
            (poster style, girl wali tight-crop nahi hai) - isliye
            object-cover + chhota aspect-ratio laga kar khali jagah crop ki */}
        <img
          src={personLeft}
          alt=""
          aria-hidden="true"
          style={{ aspectRatio: '0.58' }}
          className="h-28 sm:h-40 md:h-[21rem] lg:h-[30rem] xl:h-[34rem] object-cover object-bottom-left pointer-events-none select-none opacity-90 md:absolute md:bottom-0 md:left-0"
        />
        <img
          src={personRight}
          alt=""
          aria-hidden="true"
          className="h-28 sm:h-40 md:h-[22rem] lg:h-[32rem] xl:h-[36rem] object-contain object-bottom pointer-events-none select-none opacity-90 md:absolute md:bottom-0 md:right-0"
        />
      </div>

      <div className="text-center mt-10 md:mt-14">
        <p className="plain-text text-xs tracking-[0.3em] text-brand uppercase mb-3">
          two people, one thread
        </p>
        <h2 className="display-font text-4xl md:text-5xl lg:text-6xl xl:text-7xl max-w-2xl xl:max-w-3xl mx-auto leading-tight">
          Every message, <span className="brand-gradient-text">delivered instantly</span>
        </h2>
        <p className="plain-text mt-5 max-w-lg mx-auto text-sm sm:text-base text-app-muted leading-relaxed">
          Whether you're across the room or across the world, your messages land the
          moment you hit send - and you'll always know when they've been seen.
        </p>
      </div>
    </div>
  </section>
)

export default TwoPeopleSection
