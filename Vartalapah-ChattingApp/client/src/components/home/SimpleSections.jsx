import { useState } from 'react'
import { Link } from 'react-router-dom'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { features, steps, stats, faqs, testimonials } from './homeContent.jsx'

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
  <section id="features" className="max-w-6xl mx-auto px-6 py-20">
    <div className="flex items-end justify-between gap-6 mb-12">
      <div>
        <p className="plain-text text-xs tracking-[0.3em] text-brand uppercase mb-3">what's inside</p>
        <h2 className="display-font text-4xl md:text-5xl">Everything you need</h2>
      </div>
      <span aria-hidden="true" className="display-font hidden md:block text-7xl text-app-panel">04</span>
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
            <span className="display-font text-3xl text-app-panel group-hover:text-brand/40 transition-colors">
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
  <section id="how" className="border-t border-app-border bg-app-panel/30">
    <div className="max-w-6xl mx-auto px-6 py-20">
      <p className="plain-text text-xs tracking-[0.3em] text-brand uppercase mb-3">three steps</p>
      <h2 className="display-font text-4xl md:text-5xl mb-12">How it works</h2>

      <div className="grid md:grid-cols-3 gap-10">
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
  <section className="border-t border-app-border bg-app-panel/30">
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
    <section className="border-t border-app-border">
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
// FOOTER
// Zyada content nahi hai, isliye ek hi compact row - alag
// columns aur bottom bar mein baant kar jagah waste nahi ki
// ==========================================================
export const Footer = ({ user, goTo }) => (
  <footer className="border-t border-app-border bg-app-panel/30">
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-5">
      <span className="brand-font text-xl brand-gradient-text">Vārtālāpaḥ</span>

      <nav className="plain-text flex items-center gap-6 text-sm text-app-muted">
        <a href="#features" className="hover:text-app-text transition-colors">Features</a>
        <a href="#how" className="hover:text-app-text transition-colors">How it works</a>
        <Link to={goTo} className="hover:text-app-text transition-colors">{user ? 'Open chat' : 'Sign in'}</Link>
      </nav>

      <p className="plain-text text-xs text-app-muted">
        &copy; {new Date().getFullYear()} Vārtālāpaḥ. All rights reserved.
      </p>
    </div>
  </footer>
)
