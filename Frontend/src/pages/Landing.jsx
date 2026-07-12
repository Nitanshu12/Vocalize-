import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import Modes from '../components/landing/Modes'
import HowItWorks from '../components/landing/HowItWorks'
import Features from '../components/landing/Features'
import Gamification from '../components/landing/Gamification'
import CTA from '../components/landing/CTA'
import Footer from '../components/landing/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Modes />
      <HowItWorks />
      <Features />
      <Gamification />
      <CTA />
      <Footer />
    </div>
  )
}
