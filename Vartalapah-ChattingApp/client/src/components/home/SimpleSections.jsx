import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import useReveal from '@/hooks/ui/useReveal.js'
import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import GitHubIcon from '@mui/icons-material/GitHub'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import {
  features,
  steps,
  stats,
  faqs,
  testimonials,
  useCases,
  footerColumns,
  footerLegal,
} from '@/constants/homeContent.jsx'

// ==========================================================
// LANDING PAGE KE CHHOTE SECTIONS
//
// Ye saare section chhote hain (har ek ~20-30 line), isliye inhe
// ek hi file me rakha hai - 6 alag alag chhoti files se dhoondhna
// mushkil ho jata. Bade section (Hero, TwoPeople) apni file me hain
// ==========================================================

// ---------------- STATS STRIP ----------------
export const StatsStrip = () => (
  <section className="border-y border-app-border">
    <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      {stats.map((s) => (
        <div key={s.label}>
          <p className="display-font text-4xl brand-gradient-text">{s.value}</p>
          <p className="plain-text text-xs text-app-muted mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  </section>
)

// ---------------- FEATURES ----------------
export const FeaturesSection = () => (
  <section id="features" className="scroll-target max-w-6xl mx-auto px-6 py-20">
    <div className="flex items-end justify-between gap-6 mb-12">
      <div>
        <p className="plain-text text-xs tracking-[0.3em] text-brand uppercase mb-3">what's inside</p>
        <h2 className="display-font text-4xl md:text-5xl">Everything you need</h2>
      </div>
      <span aria-hidden="true" className="display-font hidden md:block text-7xl text-app-ghost">04</span>
    </div>

    {/* gap-px + background se patli lines ban jati hain -
        har card ke liye alag border lagane ki zarurat nahi */}
    <div className="grid sm:grid-cols-2 gap-px bg-app-border">
      {features.map((f) => (
        <div key={f.no} className="bg-app-bg p-8 hover:bg-app-panel/50 transition-colors group">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
              {f.icon}
            </div>
            <span className="display-font text-3xl text-app-ghost group-hover:text-brand/40 transition-colors">
              {f.no}
            </span>
          </div>

          <h3 className="display-font text-2xl mt-6">{f.title}</h3>
          <p className="plain-text text-sm text-app-muted mt-2 leading-relaxed">{f.text}</p>
        </div>
      ))}
    </div>
  </section>
)

// ---------------- HOW IT WORKS ----------------
export const HowItWorksSection = () => (
  <section id="how" className="scroll-target border-t border-app-border bg-app-panel/30">
    <div className="max-w-6xl mx-auto px-6 py-20">
      <p className="plain-text text-xs tracking-[0.3em] text-brand uppercase mb-3">three steps</p>
      <h2 className="display-font text-4xl md:text-5xl mb-12">How it works</h2>

      {/* sm se hi teen column: 640-767px par ek hi column me har step
          poori chaudai le leta tha aur uske daayein bahut khali jagah
          bach jaati thi. Mobile par ab bhi ek ke neeche ek hi hain */}
      <div className="grid sm:grid-cols-3 gap-10">
        {steps.map((s) => (
          <div key={s.no} className="relative pl-6 border-l border-app-border">
            {/* Line par chhota violet dot */}
            <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full brand-gradient" />

            <p className="display-font text-sm text-brand">{s.no}</p>
            <h3 className="display-font text-2xl mt-2">{s.title}</h3>
            <p className="plain-text text-sm text-app-muted mt-2 leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
)

// ==========================================================
// TESTIMONIALS
// Ek apne-aap chalti hui vertical list - ek baar me ~4 reviews
// dikhte hain, baaki loop me upar se aate rehte hain
//
// Trick: list DO baar render karte hain (HeroImages wali hi trick),
// isliye loop me jodh kahin dikhta nahi. Hover par ruk jaati hai
// taaki padh sakein. Upar-neeche "smoky" fade se hard cut nahi dikhta
// ==========================================================
export const TestimonialsSection = () => (
  <section id="reviews" className="scroll-target border-t border-app-border bg-app-panel/30">
    <div className="max-w-6xl mx-auto px-6 py-20">
      <p className="plain-text text-xs tracking-[0.3em] text-brand uppercase mb-3">testimonials</p>
      <h2 className="display-font text-4xl md:text-5xl mb-10">What our users say</h2>

      <div className="scroll-fade-y h-110 sm:h-115 overflow-hidden">
        <div className="testimonial-track flex flex-col divide-y divide-app-border">
          {[...testimonials, ...testimonials].map((t, i) => (
            <div key={i} className="py-5 flex gap-4 text-left">
              <span className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center text-sm font-semibold text-white shrink-0">
                {t.name.charAt(0)}
              </span>
              <div className="max-w-2xl">
                <p className="plain-text text-sm text-app-text leading-relaxed">"{t.quote}"</p>
                <p className="plain-text text-xs text-app-muted mt-2">{t.name} · {t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
)

// ==========================================================
// FAQ
// Ek FAQ card - click karne par grid-template-rows 0fr se 1fr tak
// animate hoti hai, isliye khulna/band hona smooth lagta hai
// (koi fixed pixel height nahi chahiye is trick me)
// ==========================================================
const FaqRow = ({ faq, isOpen, onToggle }) => (
  <div className="bg-app-bg p-6 sm:p-8 hover:bg-app-panel/50 transition-colors">
    <button onClick={onToggle} className="w-full flex items-center justify-between gap-4 text-left">
      <span className="plain-text text-sm sm:text-base font-medium">{faq.q}</span>
      <span
        className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-brand/15 border-brand text-brand rotate-180' : 'border-app-border text-app-muted'
        }`}
      >
        <ExpandMoreIcon sx={{ fontSize: 18 }} />
      </span>
    </button>

    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
        isOpen ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">
        <p className="plain-text text-sm text-app-muted leading-relaxed pr-6">{faq.a}</p>
      </div>
    </div>
  </div>
)

export const FaqSection = () => {
  // Ek baar me sirf ek hi sawaal khula rehta hai
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <section id="faq" className="scroll-target border-t border-app-border">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <p className="plain-text text-xs tracking-[0.3em] text-brand uppercase mb-3">faq</p>
        <h2 className="display-font text-4xl md:text-5xl mb-12">Common questions</h2>

        {/* Features section jaisa hi gap-px + bg-app-border trick,
            taaki poori site me ek jaisa card look rahe */}
        <div className="grid sm:grid-cols-2 gap-px bg-app-border">
          {faqs.map((f, i) => (
            <FaqRow
              key={f.q}
              faq={f}
              isOpen={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ==========================================================
// KAUN USE KARTA HAI
//
// Features section batata hai app KYA karta hai, ye batata hai
// KISKE LIYE hai - alag baat hai, dohrav nahi hota
//
// Layout jaan-boojh kar Features se alag rakha hai: wahan icon
// upar aur text neeche hai, yahan icon baayein aur text daayein.
// Isse do sections ek jaise nahi lagte
//
// Cards ek-ek karke aate hain: har card par transitionDelay thoda
// zyada, isliye scroll karte hi ek ke baad ek fade hote hain
// ==========================================================
export const UseCasesSection = () => {
  const ref = useReveal()

  return (
    <section
      id="who"
      ref={ref}
      // bg-app-panel/30 upar wale "How it works" aur neeche wale
      // Testimonials dono par bhi hai. Bina iske ye section beech me
      // ek gehra kaala block jaisa dikhta tha - dono taraf halka tint
      // aur beech me plain page ka rang
      className="scroll-target reveal border-t border-app-border bg-app-panel/30"
    >
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="reveal-child text-center">
          <p className="plain-text text-xs tracking-[0.3em] text-brand uppercase mb-3">
            who it's for
          </p>
          <h2 className="display-font text-4xl md:text-5xl">Made for everyday talking</h2>
          <p className="plain-text mt-4 mx-auto max-w-xl text-sm sm:text-base text-app-muted leading-relaxed">
            Not a workplace tool, not another social feed. Just the people you
            actually want to talk to.
          </p>
        </div>

        <div className="mt-14 grid gap-px bg-app-border sm:grid-cols-2">
          {useCases.map((u, i) => (
            <div
              key={u.title}
              className="reveal-child group flex gap-5 bg-app-bg p-8 hover:bg-app-panel/50 transition-colors"
              // Har agla card 90ms baad - ek ke baad ek aate hain.
              // Pehle card ka delay heading ke baad ka hai (140ms)
              style={{ transitionDelay: `${140 + i * 90}ms` }}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand group-hover:bg-brand/25 transition-colors">
                {u.icon}
              </span>

              <div>
                <h3 className="display-font text-2xl">{u.title}</h3>
                <p className="plain-text mt-2 text-sm text-app-muted leading-relaxed">{u.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ==========================================================
// FOOTER
//
// Zyadatar links abhi demo hain - inke peeche koi page nahi bana.
// Isliye ye <a href> nahi, <button> hain: click par sirf ek chhota
// toast dikhta hai, page na hilta hai na kahin redirect hota hai
//
// href="#" laga dete to click par page upar chala jata, aur
// href="#features" jaisa same-page link bhi nahi chahiye tha.
// button dono se bachata hai aur screen reader ko bhi sahi batata
// hai ki ye cheez navigate nahi karti
// ==========================================================

// Ek demo link - dikhta bilkul link jaisa hai, kaam button ka karta hai
const DemoLink = ({ label, onPick, className = '' }) => (
  <button
    type="button"
    onClick={() => onPick(label)}
    className={`text-left hover:text-app-text active:scale-95 transition-all duration-150 ${className}`}
  >
    {label}
  </button>
)

// Neeche aane wala chhota toast
const DemoToast = ({ label }) => (
  <div className="toast-in fixed bottom-6 left-1/2 z-50 flex items-center gap-2.5 rounded-full border border-app-border bg-app-panel px-4 py-2.5 shadow-xl shadow-black/40">
    <InfoOutlinedIcon sx={{ fontSize: 16 }} className="text-brand shrink-0" />
    <span className="plain-text text-xs text-app-text">
      "{label}" is a demo link - no page behind it yet
    </span>
  </div>
)

// Asli social links - ye demo nahi hain, sach me khulte hain
const socials = [
  { icon: <InstagramIcon sx={{ fontSize: 18 }} />, label: 'Instagram', href: 'https://www.instagram.com/sachin_28022005' },
  { icon: <LinkedInIcon sx={{ fontSize: 18 }} />, label: 'LinkedIn', href: 'https://www.linkedin.com/in/sachin-kumar-b814683a9' },
  { icon: <GitHubIcon sx={{ fontSize: 18 }} />, label: 'GitHub', href: 'https://github.com/sachin-codes01' },
  { icon: <MailOutlineIcon sx={{ fontSize: 18 }} />, label: 'Email', href: 'mailto:sachin.codes01@gmail.com' },
]

export const Footer = ({ goTo }) => {
  // Kaunsa demo link daba - toast me yahi naam dikhta hai
  const [picked, setPicked] = useState(null)

  useEffect(() => {
    if (!picked) return

    // 2.2s baad toast apne aap hat jata hai.
    // picked.id har click par badalta hai, isliye jaldi jaldi do
    // link dabane par purana timer cancel hokar naya chalu ho jata
    const timer = setTimeout(() => setPicked(null), 2200)
    return () => clearTimeout(timer)
  }, [picked])

  const pick = (label) => setPicked({ label, id: Date.now() })

  return (
    <footer className="relative border-t border-app-border bg-app-panel/30">
      {/* Chhoti screen par pehle teeno link column ek ke neeche ek poori
          chaudai me aate the - har link ke daayein bahut khali jagah aur
          footer bewajah lamba. Ab teeno column chhoti screen par bhi
          ek hi row me hain (brand unke upar poori chaudai me), aur md+
          par layout pehle jaisa hi hai */}
      <div className="max-w-6xl mx-auto px-6 py-14 grid gap-x-4 gap-y-10 sm:gap-12 grid-cols-3 md:grid-cols-[1.6fr_repeat(3,1fr)]">
        {/* ---------- BRAND ---------- */}
        <div className="col-span-3 md:col-span-1">
          <span className="brand-font text-2xl brand-gradient-text">Vārtālāpaḥ</span>
          <p className="plain-text mt-3 max-w-xs text-sm text-app-muted leading-relaxed">
            A real-time chat app built on the MERN stack with Socket.IO. Free,
            ad-free, and small enough to read end to end.
          </p>

          {/* Badge aur social icons ek hi w-max column me hain.
              w-max se column ki width uske sabse chaude bacche
              (social row) jitni ho jati hai, aur badge par w-full
              lagne se wo bhi utna hi chauda ho jata hai - Instagram
              se Email tak. Width kahin likhi nahi hai, isliye icon
              add/remove karne par bhi dono barabar rehte hain */}
          <div className="mt-6 flex w-max flex-col gap-3">
            <a
              href="https://sachin-codes01-portfolio.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-app-border text-app-muted hover:border-brand hover:text-brand active:scale-95 transition-all duration-150"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span className="plain-text text-[11px] whitespace-nowrap">
                Live · portfolio website
              </span>
            </a>

            {/* Social icons - ye asli links hain, demo nahi.
                mailto ko target/rel ki zarurat nahi (wo naya tab nahi
                kholta, mail app kholta hai), isliye sirf external
                http links par lagate hain.
                rel="noopener noreferrer" zaroori hai: iske bina nayi
                tab window.opener se hamare page ko access kar sakti hai */}
            <div className="flex gap-3">
              {socials.map((s) => {
                const isExternal = s.href.startsWith('http')

                return (
                  <a
                    key={s.label}
                    href={s.href}
                    title={s.label}
                    aria-label={s.label}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border text-app-muted hover:border-brand hover:text-brand active:scale-95 transition-all duration-150"
                  >
                    {s.icon}
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* ---------- LINK COLUMNS ----------
            In teeno columns ke links ke peeche abhi apna koi page
            nahi bana, isliye teeno login par bhej dete hain (logged-in
            user ho to chat par). Ye asli <Link> hain, demo nahi -
            isliye inpar toast nahi aata */}
        {footerColumns.map((col) => (
          <nav key={col.title} className="plain-text flex flex-col gap-3 text-sm text-app-muted">
            <p className="text-xs uppercase tracking-[0.2em] text-app-text">{col.title}</p>
            {col.links.map((l) => (
              <Link
                key={l}
                to={goTo}
                className="text-left hover:text-app-text active:scale-95 transition-all duration-150"
              >
                {l}
              </Link>
            ))}
          </nav>
        ))}
      </div>

      {/* ---------- NEECHE KI PATTI ---------- */}
      <div className="border-t border-app-border">
        <div className="plain-text max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-app-muted">
          <p>&copy; {new Date().getFullYear()} Vārtālāpaḥ. All rights reserved.</p>

          <div className="flex items-center gap-6">
            {footerLegal.map((l) => (
              <DemoLink key={l} label={l} onPick={pick} />
            ))}
          </div>
        </div>
      </div>

      {/* key par picked.id dene se har click par animation dobara
          chalti hai - warna toast pehle se khula ho to naya label
          bina kisi movement ke chupchap badal jata */}
      {picked && <DemoToast key={picked.id} label={picked.label} />}
    </footer>
  )
}
