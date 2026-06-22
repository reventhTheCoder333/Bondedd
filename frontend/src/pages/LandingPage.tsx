import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import LogoCloud from '../components/landing/LogoCloud'
import FeatureGrid from '../components/landing/FeatureGrid'
import HowItWorks from '../components/landing/HowItWorks'
import AppDemoRow from '../components/landing/AppDemoRow'
import WhyChoose from '../components/landing/WhyChoose'
import QuoteSection from '../components/landing/QuoteSection'
import FAQSection from '../components/landing/FAQSection'
import Footer from '../components/landing/Footer'

export default function LandingPage() {
  return (
    <div id="top" className="relative bg-white min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <LogoCloud />
      <FeatureGrid />
      <HowItWorks />
      <AppDemoRow />
      <WhyChoose />
      <QuoteSection />
      <div className="relative">
        <FAQSection />
        <Footer />
      </div>
    </div>
  )
}
