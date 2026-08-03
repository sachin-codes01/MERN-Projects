import { useRef } from 'react'
import { Link } from 'react-router-dom'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { HeroRail, HeroImages } from './HeroParts.jsx'
import HeroMessageFlow from './HeroMessageFlow.jsx'

// ==========================================================
// HERO - sabse upar wali poori screen
// Baayein slide hoti images, daayein bada heading
// ==========================================================
const HeroSection = ({ user, goTo }) => {
  // Peeche dikhne wala bada number = abhi ka mahina
  // getMonth() 0 se shuru hota hai (January = 0), isliye +1 karte hain
  // padStart(2,'0') se 8 ki jagah "08" ban jata hai
  const monthNumber = String(new Date().getMonth() + 1).padStart(2, '0')

  // Naam ke upar tairte message in dono ka naap dekh kar apni jagah
  // banate hain - naam kitna chauda hai, aur bada number kahan tak
  // faila hai (dekho HeroMessageFlow.jsx)
  const titleRef = useRef(null)
  const numberRef = useRef(null)

  return (
    // select-none = is poore hero ka text mouse se select nahi hota,
    // isliye copy bhi nahi kar sakte.
    // Dhyan rakhna: ye sirf normal copy-paste rokta hai. Koi banda
    // page ka source ya DevTools khole to text wahan phir bhi dikhega -
    // browser me text ko poori tarah chhupaya nahi ja sakta
    <div className="relative overflow-hidden lg:h-screen select-none">
      <HeroRail />

      {/* ---------- MAIN GRID ---------- */}
      <div className="grid lg:grid-cols-[46%_54%] lg:h-full">
        {/* ===== LEFT: slide hoti images ===== */}
        <HeroImages />

        {/* ===== RIGHT: heading aur text ===== */}
        <div className="relative flex items-center px-6 sm:px-10 lg:px-14 py-12 lg:py-0">
          {/* Peeche ka bada dhundhla number */}
          <span
            ref={numberRef}
            aria-hidden="true"
            className="display-font absolute top-2 right-4 lg:right-10 text-[8rem] sm:text-[13rem] lg:text-[16rem] leading-none text-app-ghost/60 select-none pointer-events-none"
          >
            {monthNumber}
          </span>

          {/* lg:translate-y-[50px] - bade screen par naam ke upar bahut
              zyada khali jagah bach rahi thi, isliye poora block (naam +
              text + button) thoda neeche khiska diya. translate use kiya
              hai margin nahi: parent items-center hai, to margin dene se
              block aadha hi khiskta aur hisaab bigad jata.
              Tablet/mobile par ye class lagti hi nahi - wahan sab waisa hi */}
          <div className="relative w-full max-w-2xl lg:translate-y-[50px]">
            {/* Naam ke upar tairte hue message - sirf lg+ par dikhte hain */}
            <HeroMessageFlow titleRef={titleRef} numberRef={numberRef} />
            {/* Heading me website ka naam
                Font size har screen ke hisaab se badalti hai. Har
                breakpoint par maap kar dekha hai ki text column me araam se aaye.
                Purane naap (font size -> text ki width / available jagah):
                  mobile 60px -> 277px (327px jagah me)
                  lg      80px -> 369px (441px jagah me)
                  xl      96px -> 443px (571px jagah me)

                Naam bada karna tha, to jahan jagah thi wahan badhaya hai.
                lg (1024px) par size nahi badha sakte: wahan column sirf
                433px ka hai aur 88px ka naam 424px le leta hai - bas 9px
                bachte hain. Cyrene font swap se load hota hai, to load
                hone tak system font dikhta hai jo thoda chauda ho sakta
                hai - itni tight jagah me naam toot kar agli line me
                chala jata. Isliye lg par purana 80px hi rakha hai aur
                1120px se badhaya, jahan jagah sach me hai */}
            <h1 ref={titleRef} className="brand-font text-[4rem] sm:text-8xl lg:text-[5rem] min-[1120px]:text-[5.5rem] xl:text-[7rem] leading-[0.9] brand-gradient-text break-words">
              Vārtālāpaḥ
            </h1>

            {/* Naam bada hone ke baad text ko thoda aur neeche kiya
                (mt-6 se mt-10) - warna bade naam se chipka lagta tha.
                lg par gap thoda kam (mt-6) - block neeche khiskane ke
                baad naam-text-button teeno ka ek saath hona hi accha
                lagta hai. Chhoti screen par mt-10 hi rehta hai */}
            <p className="plain-text mt-10 lg:mt-6 text-sm text-app-muted max-w-md leading-relaxed">
              A real-time chat app built with React, Node and Socket.IO. Sign in
              with Google and talk to anyone - text, photos and short videos,
              delivered the moment you hit send.
            </p>

            {/* ---- CALL TO ACTION ----
                Do hisse ek hi row me: button aur uske aage ek patti.
                items-stretch se dono ki height apne aap barabar rehti hai,
                isliye ye hamesha sidhe align rehte hain */}
            <div className="mt-10 lg:mt-7 flex items-stretch max-w-md">
              <Link
                to={goTo}
                className="group inline-flex items-center gap-3 shrink-0 bg-app-panel hover:bg-app-hover border-b-2 border-brand px-7 py-4 transition-colors"
              >
                <span className="text-sm tracking-[0.15em] uppercase">
                  {user ? 'open chat' : 'get started'}
                </span>
                <ArrowForwardIcon
                  sx={{ fontSize: 16 }}
                  className="text-brand group-hover:translate-x-1 transition-transform"
                />
              </Link>

              {/* Patti khali chhodne ki jagah usme chhoti si jaankari daal di */}
              <div className="flex-1 flex items-center px-4 bg-app-panel/40 border-b-2 border-app-border">
                <span className="plain-text text-[11px] text-app-muted leading-tight">
                  {user
                    ? 'Pick up where you left off'
                    : 'Free · Sign in with Google · No password'}
                </span>
              </div>
            </div>

            {user && (
              <p className="plain-text mt-4 text-xs text-app-muted">
                Welcome back, {user.name.split(' ')[0]}.
              </p>
            )}
          </div>

          {/* ---------- BOTTOM NAV ---------- */}
          <div className="absolute bottom-8 right-14 hidden lg:flex gap-10 text-sm text-app-muted">
            <a href="#features" className="hover:text-app-text transition-colors">features</a>
            <a href="#how" className="hover:text-app-text transition-colors">how it works</a>
            <Link to={goTo} className="hover:text-app-text transition-colors">
              {user ? 'chat' : 'login'}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile par bottom nav neeche aata hai */}
      <div className="flex lg:hidden justify-center gap-8 pb-10 text-sm text-app-muted">
        <a href="#features" className="hover:text-app-text transition-colors">features</a>
        <a href="#how" className="hover:text-app-text transition-colors">how it works</a>
        <Link to={goTo} className="hover:text-app-text transition-colors">
          {user ? 'chat' : 'login'}
        </Link>
      </div>
    </div>
  )
}

export default HeroSection
