import Hero from "../components/Hero";
import CategoryMoves from "../components/CategoryMoves";       // "Shop by Collection" — was "What's Your Move?"
import StorySection from "../components/StorySection";         // "The Story of MDN" — unchanged
import TrustStrip from "../components/TrustStrip";              // new sliding trust strip
import WhyOne from "../components/WhyOne";                      // new "Why One" image section
import AssuredBadges from "../components/AssuredBadges";        // new "AS-IT-IS Assured" carousel
import Bestsellers from "../components/Bestsellers";            // now a drag/dot carousel
import TargetSection from "../components/TargetSection";        // "What's Your Target?" — now a single-row slider
import BundleOffers from "../components/BundleOffers";          // new "Bundles & Offers" carousel
import ReviewsSection from "../components/ReviewsSection";      // "Real People, Real Stories"
import FAQ from "../components/FAQ";                            // unchanged

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryMoves />
      <StorySection />
      <TrustStrip />
      <WhyOne />
      <AssuredBadges />
      <Bestsellers />
      <TargetSection />
      <BundleOffers />
      <ReviewsSection />
      <FAQ />
    </>
  );
}
