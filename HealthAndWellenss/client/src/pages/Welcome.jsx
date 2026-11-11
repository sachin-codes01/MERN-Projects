import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '@mui/material/Button'
import ArrowForward from '@mui/icons-material/ArrowForward'
import Logo from '../components/brand/Logo.jsx'
import BotanicalScene from '../components/brand/BotanicalScene.jsx'
import SectionFlowerScatter from '../components/brand/SectionFlowerScatter.jsx'
import SideMist from '../components/brand/SideMist.jsx'
import DecoratedHeading from '../components/brand/DecoratedHeading.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSettings } from '../context/SettingsContext.jsx'
import { useFetch } from '../hooks/useFetch.js'
import { publicApi } from '../api/index.js'
import { durationLabel, firstName, formatCurrency } from '../utils/format.js'
import './Welcome.css'
import './WelcomeGarden.css'
import { useScrollReveal } from '../hooks/useGentleMotion.js'

const Branch = ({ name, className = '' }) => <img className={`garden-branch ${className}`} src={`/images/botanical-branches/${name}.png`} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable="false" />
const Photo = ({ className = '', variant = 'blossom' }) => <BotanicalScene className={className} variant={variant} />
const SectionFooter = ({ number }) => <div className="folio"><span>Shree Radhey Shyam</span><span>Health &amp; Wellness Centre</span><span>{number}</span></div>

const Welcome = () => {
  useEffect(() => {
    document.documentElement.classList.add('landing-scrollbar-hidden')
    return () => document.documentElement.classList.remove('landing-scrollbar-hidden')
  }, [])
  const motionRef = useScrollReveal()
  const { customer } = useAuth()
  const { settings } = useSettings()
  const therapies = useFetch(() => publicApi.therapies())
  return <div ref={motionRef} className="studio-landing">
    <SideMist />
    <a className="studio-skip" href="#landing-content">Skip to content</a>
    <header className="studio-header">
      <Link to="/" aria-label="Shree Radhey Shyam home"><Logo size="sm" /></Link>
      <Link to="/" className="studio-header-name"><span>Shree Radhey Shyam</span><span>Health &amp; Wellness Centre</span></Link>
      <nav aria-label="Landing page navigation"><a href="#introduction">About</a><a href="#therapies">Therapies</a><a href="#contact">Contact</a><Link to="/login">Log in <ArrowForward fontSize="inherit" /></Link></nav>
    </header>
    <main id="landing-content">
      <section className="studio-hero" aria-labelledby="hero-title">
        <div className="hero-flower-trail" aria-hidden="true">
          <img className="hero-marked-flower hero-marked-flower--top-gold" src="/images/botanicals/sunflower.png" alt="" decoding="async" />
          <img className="hero-marked-flower hero-marked-flower--top-blue" src="/images/botanicals/blue-hydrangea.png" alt="" decoding="async" />
          <img className="hero-marked-flower hero-marked-flower--bottom-white" src="/images/botanicals/daisy.png" alt="" decoding="async" />
          <img className="hero-marked-flower hero-marked-flower--bottom-purple" src="/images/botanicals/violets.png" alt="" decoding="async" />
          <img className="hero-marked-flower hero-marked-flower--marked-top" src="/images/botanicals/cherry-blossoms.png" alt="" decoding="async" />
          <img className="hero-marked-flower hero-marked-flower--marked-heading" src="/images/botanicals/blue-hydrangea.png" alt="" decoding="async" />
          <img className="hero-marked-flower hero-marked-flower--marked-middle-white" src="/images/botanicals/daisy.png" alt="" decoding="async" />
          <img className="hero-marked-flower hero-marked-flower--marked-middle-pink" src="/images/botanicals/pink-blossoms.png" alt="" decoding="async" />
          <img className="hero-marked-flower hero-marked-flower--marked-bottom" src="/images/botanicals/cherry-blossoms.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--spread-left-top" src="/images/botanicals/cherry-blossoms.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--spread-left-bottom" src="/images/botanicals/sunflower.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--spread-right-top" src="/images/botanicals/blue-hydrangea.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--spread-right-bottom" src="/images/botanicals/pink-blossoms.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--fill-top" src="/images/botanicals/pink-blossoms.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--fill-upper" src="/images/botanicals/violets.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--fill-center" src="/images/botanicals/jasmine.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--fill-lower" src="/images/botanicals/hibiscus.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--fill-base" src="/images/botanicals/daisy.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--cluster-white" src="/images/botanicals/daisy.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--cluster-rose" src="/images/botanicals/cherry-blossoms.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--cluster-gold" src="/images/botanicals/sunflower.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--cluster-blue" src="/images/botanicals/blue-hydrangea.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--middle-purple" src="/images/botanicals/violets.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--middle-pink" src="/images/botanicals/pink-blossoms.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--gold" src="/images/botanicals/sunflower.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--rose" src="/images/botanicals/hibiscus.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--blue" src="/images/botanicals/blue-hydrangea.png" alt="" decoding="async" />
          <img className="hero-trail-flower hero-trail-flower--pink" src="/images/botanicals/cherry-blossoms.png" alt="" decoding="async" />
        </div>
        <div className="studio-hero-meta"><span>Natural Healing.<br />Personal wellness.</span><span>SHREE RADHEY SHYAM<br />HEALTH &amp; WELLNESS CENTRE</span></div>
        <h1 data-butterfly-land id="hero-title"><span className="hero-first-line">NATURAL<span className="hero-heading-orbit" aria-hidden="true" /></span><br /><span className="hero-last-line">Balance<span className="hero-heading-stroke" aria-hidden="true" /></span><img className="hero-heading-flower" src="/images/botanicals/jasmine.png" alt="" aria-hidden="true" decoding="async" /><img className="hero-flower-companion hero-flower-companion--pink" src="/images/botanicals/pink-blossoms.png" alt="" aria-hidden="true" decoding="async" /><img className="hero-flower-companion hero-flower-companion--blue" src="/images/botanicals/blue-hydrangea.png" alt="" aria-hidden="true" decoding="async" /><img className="hero-heading-butterfly" src="/images/botanicals/amber-butterfly.png" alt="" aria-hidden="true" decoding="async" /></h1>
        <figure className="studio-hero-photo"><img className="studio-hero-branch" src="/images/botanical-branches/pink-flowering-branch.png" alt="" aria-hidden="true" decoding="async" /><BotanicalScene variant="sanctuary" eager /><figcaption>Natural Healing for a Better You</figcaption></figure>
        <div className="studio-hero-caption"><span>RELAX.<br />RESTORE.<br />REBALANCE.</span><p>Experience the perfect blend of ancient healing techniques and modern therapy to relax your body, refresh your mind and restore your inner balance.</p></div>
        <div className="studio-hero-actions">{customer && <Button component={Link} to="/home" variant="contained" color="secondary">Continue as {firstName(customer.name)}</Button>}<Button component={Link} to="/register" variant="contained" endIcon={<ArrowForward />}>New Customer</Button><Button component={Link} to="/login" variant="outlined">Already Visited Us?</Button><Link className="studio-text-link" to="/therapies">Explore Our Therapies <ArrowForward fontSize="small" /></Link></div>
        <SectionFooter number="00" />
      </section>

      <section className="studio-section studio-introduction" id="introduction" aria-labelledby="intro-title">
        <SectionFlowerScatter variant="introduction" />
        <p className="studio-kicker">The centre / Introduction</p>
        <div className="studio-intro-layout"><div className="garden-portrait"><div className="garden-portrait-flowers" aria-hidden="true">
<img src="/images/botanicals/cherry-blossoms.png" alt="" loading="lazy" decoding="async" />
<img src="/images/botanicals/sunflower.png" alt="" loading="lazy" decoding="async" />
<img src="/images/botanicals/blue-hydrangea.png" alt="" loading="lazy" decoding="async" />
<img src="/images/botanicals/daisy.png" alt="" loading="lazy" decoding="async" />
</div><Photo className="studio-intro-photo" variant="portrait" /></div><div className="studio-intro-copy"><div className="studio-title-row"><DecoratedHeading id="intro-title">Care that<br /><em>starts with you.</em></DecoratedHeading><span className="studio-number" aria-hidden="true">01</span></div><div className="studio-columns"><p>Welcome to Shree Radhey Shyam Health &amp; Wellness Centre. Experience natural healing therapies to relax, restore and rebalance.</p><p>Create your wellness profile once. Your details, previous visits and appointments stay together, ready whenever you return.</p></div><Link to="/check-in" className="studio-text-link">Begin your wellness journey <ArrowForward fontSize="small" /></Link></div></div>
        <SectionFooter number="01" />
      </section>

      <section className="studio-section studio-services" id="therapies" aria-labelledby="services-title">
        <SectionFlowerScatter variant="services" />
        <p className="studio-kicker">Explore / Our therapies</p>
        <div className="studio-services-layout"><div><div className="studio-service-title"><span className="studio-number" aria-hidden="true">02</span><DecoratedHeading id="services-title">Our <br /><em>Therapies</em></DecoratedHeading></div><p className="studio-section-description">Natural healing therapies to relax, restore and rebalance.</p><div className="studio-therapy-list">{therapies.loading && !therapies.data && <p role="status">Loading therapies...</p>}{therapies.error && <div><p>Therapies could not be loaded.</p><Button onClick={therapies.reload}>Try again</Button></div>}{therapies.data?.slice(0, 4).map((therapy, index) => <Link key={therapy._id} to={`/therapies/${therapy.slug}`} className="studio-therapy-row"><span className="studio-therapy-index">{String(index + 1).padStart(2, '0')}</span><div><h3>{therapy.name}</h3><p>{durationLabel(therapy)} <span> / </span> {formatCurrency(therapy.price)}</p></div><ArrowForward fontSize="small" /></Link>)}{therapies.data?.length === 0 && <p>Explore our therapies or contact the centre for details.</p>}</div><Link className="studio-text-link" to="/therapies">View all therapies <ArrowForward fontSize="small" /></Link></div><figure className="studio-service-photo"><Branch name="green-canopy" className="garden-service-canopy" /><Photo variant="lotus" /><figcaption>Relax your body.<br />Restore your inner balance.</figcaption></figure></div>
        <SectionFooter number="02" />
      </section>

      <section className="studio-section studio-journey" aria-labelledby="journey-title">
        <p className="studio-kicker">Your visit / A simple process</p>
        <div className="studio-journey-layout"><div><DecoratedHeading id="journey-title">Your wellness.<br /><em>All together.</em></DecoratedHeading><span className="studio-number" aria-hidden="true">03</span><Link to="/check-in" className="studio-text-link">Check in at the centre <ArrowForward fontSize="small" /></Link><Branch name="falling-leaf-branch" className="garden-journey-leaves" /></div><div className="studio-journey-steps"><article><span>01</span><div><h3>Scan &amp; register</h3><p>Scan the reception QR and share your name, date of birth, mobile number, address and concern. Receive your unique Customer ID.</p></div></article><article><span>02</span><div><h3>Return with ease</h3><p>Log in with the same mobile number to see your saved profile, visit history and personal QR card.</p></div></article><article><span>03</span><div><h3>Stay connected</h3><p>View follow-ups, explore eligible loyalty offers and rate your experience after a completed session.</p></div></article></div></div>
        <SectionFooter number="03" />
      </section>

      <section className="studio-section studio-loyalty" aria-labelledby="loyalty-title">
        <p className="studio-kicker">Keep coming back / Loyalty &amp; offers</p>
        <div className="studio-loyalty-layout"><div className="studio-loyalty-heading"><span className="studio-number" aria-hidden="true">04</span><DecoratedHeading id="loyalty-title">Every visit.<br /><em>A little more.</em></DecoratedHeading><p>Keep your wellness journey going with loyalty points and eligible offers.</p><Link to="/loyalty" className="studio-text-link">Explore loyalty &amp; offers <ArrowForward fontSize="small" /></Link></div><div className="studio-loyalty-details"><article><Branch name="pink-flowering-branch" className="garden-benefit-art" /><span>01 / Your visits</span><h3>A history that stays with you.</h3><p>Your completed sessions stay in your visit history, linked to your unique Customer ID.</p></article><article><Branch name="green-canopy" className="garden-benefit-art" /><span>02 / Your rewards</span><h3>Points for coming back.</h3><p>Earn loyalty points on completed visits. View your membership tier and available offers in your profile.</p></article><article><Branch name="purple-flowering-vine" className="garden-benefit-art" /><span>03 / Your next session</span><h3>Offers made easy to use.</h3><p>Choose an eligible offer while booking. Your booking summary shows the discount before you confirm.</p></article></div></div>
        <SectionFooter number="04" />
      </section>

      <section className="studio-section studio-aftercare" aria-labelledby="aftercare-title">
        <p className="studio-kicker">After your visit / Follow-ups &amp; feedback</p>
        <div className="studio-aftercare-layout"><figure className="garden-aftercare-art"><Branch name="purple-flowering-vine" className="garden-aftercare-vine" /><Photo variant="calm" /><figcaption>Natural Healing for a Better You</figcaption></figure><div><div className="studio-title-row"><DecoratedHeading id="aftercare-title">Care continues.<br /><em>So does the conversation.</em></DecoratedHeading><span className="studio-number" aria-hidden="true">05</span></div><div className="studio-columns"><div><h3>Stay on track</h3><p>View scheduled follow-ups and reminders in your account. Choose whether you want follow-up messages in your profile preferences.</p><Link to="/reminders" className="studio-text-link">My reminders <ArrowForward fontSize="small" /></Link></div><div><h3>Tell us how it felt</h3><p>After a completed session, open your visit history and select a rating. Add a comment to share more about your experience.</p><Link to="/history" className="studio-text-link">Rate a completed visit <ArrowForward fontSize="small" /></Link></div></div></div></div>
        <SectionFooter number="05" />
      </section>

      <section className="studio-section studio-faq" aria-labelledby="faq-title">
        <SectionFlowerScatter variant="faq" />
        <p className="studio-kicker">Before your visit / A few useful answers</p>
        <div className="studio-faq-layout"><div><DecoratedHeading id="faq-title">Good to know.</DecoratedHeading><span className="studio-number" aria-hidden="true">06</span><Branch name="bougainvillea-vine" className="garden-faq-vine" /></div><div className="studio-faq-list"><details><summary>Is this your first visit?</summary><p>Scan the reception QR or choose New Customer. Fill in your details, verify your mobile number and receive your unique Customer ID and personal QR card.</p></details><details><summary>Do I need to register every time?</summary><p>No. Use the same registered mobile number and OTP to access your saved profile, previous visits and appointments.</p></details><details><summary>How do I choose a therapy?</summary><p>Explore the therapy catalogue to see descriptions, duration, prices and areas addressed. Contact the centre if you need help choosing.</p></details><details><summary>When can I rate my experience?</summary><p>After staff mark your session as completed, open Visit History and choose Rate visit.</p></details><details><summary>How do I manage message preferences?</summary><p>Open My Profile to change your follow-up and promotional message preferences. Your health details are visible only to authorised centre staff.</p></details></div></div>
        <SectionFooter number="06" />
      </section>

      <section className="studio-section studio-contact" id="contact" aria-labelledby="contact-title">
        <SectionFlowerScatter variant="contact" />
        <p className="studio-kicker">07 / Shree Radhey Shyam / Visit the centre</p>
        <div className="studio-contact-heading"><DecoratedHeading id="contact-title">Contact Us</DecoratedHeading></div>
        <div className="studio-contact-layout"><div className="studio-contact-copy"><h3>{settings.centreName}</h3>{settings.phone && <div><span>Phone</span><a href={`tel:${settings.phone}`}>{settings.phone}</a></div>}{settings.openingHours && <div><span>Opening hours</span><p>{settings.openingHours}</p></div>}<Link to="/check-in" className="studio-text-link">Register or log in <ArrowForward fontSize="small" /></Link></div><div className="garden-contact-art"><Branch name="green-canopy" className="garden-contact-canopy" /><Photo className="studio-contact-photo" variant="garden" /></div><div className="studio-contact-copy">{settings.email && <div><span>Email</span><a href={`mailto:${settings.email}`}>{settings.email}</a></div>}{settings.address && <div><span>Address</span><p>{settings.address}</p></div>}<p className="studio-contact-tagline">Natural Healing<br /><em>for a Better You.</em></p></div></div>
        <SectionFooter number="07" />
      </section>
    </main>
    <footer className="studio-bottom"><span>{settings.centreName}</span><Link to="/admin/login">Centre staff? Staff login <ArrowForward fontSize="inherit" /></Link><a href="#landing-content">Back to top</a></footer>
  </div>
}
export default Welcome




