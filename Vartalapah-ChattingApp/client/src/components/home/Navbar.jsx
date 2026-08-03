import { Link } from 'react-router-dom'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { navButtons } from '@/constants/homeContent.jsx'

// ==========================================================
// NAVBAR - upar chipki hui patti
//
// Teen cheezein: logo (baayein), page ke sections ke plain text
// links (beech), aur login button (daayein). Beech wale plain
// rakhe hain - agar unpar bhi border/box hota to login button ka
// dhyan bat jata aur pata nahi chalta ki asli CTA kaunsa hai
//
// Shuru me dikhti nahi. Jab hero (pehla section) poora viewport
// se bahar nikal jata hai tabhi upar se sarak kar aati hai -
// `show` prop Home.jsx se aata hai (dekho useSectionPassed hook)
//
// `fixed` hai, `sticky` nahi. Sticky hota to ye page ke flow me
// 64px jagah gher leta aur neeche ka hero utna khisak jata. fixed
// jagah nahi gherta, isliye hero bilkul waisa hi rehta hai
//
// Chhupane ke liye display:none ki jagah -translate-y-full use
// kiya hai - isse aane-jaane par slide animation milti hai.
// Saath me invisible bhi lagaya hai taaki chhupi hui patti par
// galti se click na ho jaye
// ==========================================================
const Navbar = ({ user, goTo, show }) => (
  <header
    className={`fixed inset-x-0 top-0 z-50 border-b border-app-border bg-app-bg/80 backdrop-blur-md transition-all duration-300 ${
      show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 invisible'
    }`}
  >
    <div className="max-w-7xl mx-auto h-16 flex items-center justify-between gap-6 px-6 lg:px-10">
      {/* Logo par click = sabse upar. Yahan `#top` wala link nahi
          use kiya kyunki uske liye hero me id daalni padti, aur
          hero ko chhedna nahi hai */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="brand-font text-xl sm:text-2xl brand-gradient-text shrink-0"
      >
        Vārtālāpaḥ
      </button>

      {/* ---------- SECTION LINKS ----------
          Ye page ke andar hi le jate hain, isliye <a href="#..."> hain,
          <button> nahi - browser ko pata rehta hai ki ye navigation hai
          (naye tab me kholna, keyboard shortcuts, sab kaam karta hai)

          md se chhoti screen par chhupa dete hain, wahan jagah nahi hoti */}
      <nav className="hidden md:flex items-center gap-8 plain-text text-sm text-app-muted">
        {navButtons.map((b) => (
          <a key={b.href} href={b.href} className="hover:text-app-text transition-colors">
            {b.label}
          </a>
        ))}
      </nav>

      {/* Style hero wale CTA se hi liya hai (bg-app-panel + neeche
          brand ki patli line + uppercase tracked text) - sirf padding
          aur font chhota kar diya taaki 64px ki navbar me fit ho.
          Pehle yahan rounded gradient pill tha jo baaki site ke
          squared look se match nahi kar raha tha */}
      <Link
        to={goTo}
        className="group inline-flex items-center gap-2.5 shrink-0 bg-app-panel hover:bg-app-hover border-b-2 border-brand px-5 py-2.5 transition-colors"
      >
        <span className="text-xs tracking-[0.15em] uppercase">
          {user ? 'open chat' : 'login'}
        </span>
        <ArrowForwardIcon
          sx={{ fontSize: 14 }}
          className="text-brand group-hover:translate-x-1 transition-transform"
        />
      </Link>
    </div>
  </header>
)

export default Navbar
