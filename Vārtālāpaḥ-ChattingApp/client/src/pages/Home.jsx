import { useAuth } from '../context/AuthContext.jsx'
import HeroSection from '../components/home/HeroSection.jsx'
import TwoPeopleSection from '../components/home/TwoPeopleSection.jsx'
import {
  StatsStrip,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  FaqSection,
  Footer,
} from '../components/home/SimpleSections.jsx'

// ==========================================================
// HOME - landing page (jo logged-out user ko dikhta hai)
//
// Ye file sirf sections ko sahi order me jodti hai. Har section
// ka apna component hai components/home/ me, aur unka saara likha
// hua text homeContent.jsx me:
//
//   HeroSection        -> upar wala poora screen wala hissa
//   StatsStrip         -> 100% free / 1-tap / 0 ads / 24-7
//   TwoPeopleSection   -> tairte hue message chips wala hissa
//   FeaturesSection    -> "Everything you need" ke 4 cards
//   HowItWorksSection  -> 3 steps
//   TestimonialsSection-> apne aap chalti hui reviews list
//   FaqSection         -> khulne-band hone wale sawaal
//   Footer
// ==========================================================
const Home = () => {
  // Agar user pehle se logged in hai to button ka text badal dete hain
  const { user } = useAuth()
  const goTo = user ? '/chat' : '/login'

  return (
    <div className="bg-app-bg text-app-text overflow-x-hidden">
      <HeroSection user={user} goTo={goTo} />
      <StatsStrip />
      <TwoPeopleSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FaqSection />
      <Footer user={user} goTo={goTo} />
    </div>
  )
}

export default Home
