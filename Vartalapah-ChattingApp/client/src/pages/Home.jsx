import { useRef } from 'react'
import { useAuth } from '@/context/AuthContext.jsx'
import useSectionPassed from '@/hooks/ui/useSectionPassed.js'
import ClickSpark from '@/components/ui/ClickSpark.jsx'
import Navbar from '@/components/home/Navbar.jsx'
import HeroSection from '@/components/home/HeroSection.jsx'
import TwoPeopleSection from '@/components/home/TwoPeopleSection.jsx'
import {
  StatsStrip,
  FeaturesSection,
  HowItWorksSection,
  UseCasesSection,
  TestimonialsSection,
  FaqSection,
  Footer,
} from '@/components/home/SimpleSections.jsx'

// ==========================================================
// HOME - landing page (jo logged-out user ko dikhta hai)
//
// Ye file sirf sections ko sahi order me jodti hai. Har section
// ka apna component hai components/home/ me, aur unka saara likha
// hua text homeContent.jsx me:
//
//   Navbar             -> upar chipki patti (hero bahar jane par hi dikhti hai)
//   HeroSection        -> upar wala poora screen wala hissa
//   StatsStrip         -> 100% free / 1-tap / 0 ads / 24-7
//   TwoPeopleSection   -> tairte hue message chips wala hissa
//   FeaturesSection    -> "Everything you need" ke 4 cards
//   HowItWorksSection  -> 3 steps
//   UseCasesSection    -> kaun use karta hai (cards ek-ek karke aate hain)
//   TestimonialsSection-> apne aap chalti hui reviews list
//   FaqSection         -> khulne-band hone wale sawaal
//   Footer
// ==========================================================
const Home = () => {
  // Agar user pehle se logged in hai to button ka text badal dete hain
  const { user } = useAuth()
  const goTo = user ? '/chat' : '/login'

  // Hero ko ek plain div me lapet diya hai sirf isliye ki uska ref
  // mil sake - HeroSection.jsx ko chhedne ki zarurat na pade.
  // Ye div khud koi style nahi lagata, isliye layout waisa hi rehta hai
  const heroRef = useRef(null)
  const heroPassed = useSectionPassed(heroRef)

  return (
    // ClickSpark poore landing page par click hone par chingariyan
    // dikhata hai. Uska canvas pointer-events-none hai, isliye neeche
    // ke buttons/links normal kaam karte rehte hain
    //
    // Rang site ka brand violet hai - #fff (default) is dark navy
    // background par bahut chubhta tha
    <ClickSpark sparkColor="#a855f7" sparkSize={10} sparkRadius={18} sparkCount={8} duration={420}>
      {/* scroll-smooth isliye: navbar ke # links par click karne se page
          jhatke se nahi, sarak kar us section tak jata hai */}
      <div className="bg-app-bg text-app-text overflow-x-hidden scroll-smooth">
        <Navbar user={user} goTo={goTo} show={heroPassed} />

        <div ref={heroRef}>
          <HeroSection user={user} goTo={goTo} />
        </div>
        <StatsStrip />
        <TwoPeopleSection />
        <FeaturesSection />
        <HowItWorksSection />
        <UseCasesSection />
        <TestimonialsSection />
        <FaqSection />
        <Footer goTo={goTo} />
      </div>
    </ClickSpark>
  )
}

export default Home
