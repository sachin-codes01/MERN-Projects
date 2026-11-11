import { Link } from 'react-router-dom'
import Logo from '../brand/Logo.jsx'
import './AuthShell.css'

// Welcome, login, registration pages ka dhaancha:
// mobile pe ek card, desktop pe left side brand panel + right side form
const AuthShell = ({ children, hideMobileLogo = false, maxWidth = 'max-w-md', compact = false }) => (
  <div className={`auth-shell ${compact ? 'auth-shell--compact' : ''} relative min-h-screen lg:grid lg:grid-cols-[0.95fr_1.05fr]`}>
    {/* Desktop brand panel */}
    <aside className="auth-brand relative hidden flex-col items-start justify-center overflow-hidden bg-brand-900 px-12 py-16 lg:flex xl:px-20">
      <Link to="/" className="auth-brand-home" aria-label="Back to homepage" />
      <div className="auth-brand-mark"><Logo size="md" /></div>
      <div className="auth-brand-message">
        <span>SHREE RADHEY SHYAM · HEALTH & WELLNESS</span>
        <h1>Natural Healing<br /><em>for a Better You.</em></h1>
        <p>A little care. A renewed sense of balance.</p>
      </div>
      <div className="auth-brand-garden" aria-hidden="true">
        <div className="auth-garden-halo" />
        <img className="auth-garden-leaves" src="/images/botanicals/bamboo.png" alt="" />
        <img className="auth-garden-blossom" src="/images/botanical-branches/pink-flowering-branch.png" alt="" />
        <img className="auth-garden-lotus" src="/images/botanicals/white-lotus.png" alt="" />
        <img className="auth-garden-butterfly" src="/images/botanicals/pink-butterfly.png" alt="" />
      </div>
      <div className="auth-brand-caption">RELAX <i /> RESTORE <i /> REBALANCE</div>
    </aside>

    {/* Form side */}
    <main className="relative flex min-h-screen min-w-0 flex-col items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-12">
      <div className={`relative min-w-0 w-full ${maxWidth}`}>
        {!hideMobileLogo && (
          <Link to="/" className="mb-6 flex justify-center lg:hidden">
            <Logo size="md" stacked />
          </Link>
        )}
        {children}
      </div>
    </main>
  </div>
)

export default AuthShell
