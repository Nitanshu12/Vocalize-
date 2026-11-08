import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from '../components/landing/Navbar'
import Features from '../components/landing/Features'
import Gamification from '../components/landing/Gamification'
import CTA from '../components/landing/CTA'
import Footer from '../components/landing/Footer'
import ZoomIntro from '../components/story/ZoomIntro'
import WordFill from '../components/story/WordFill'
import SessionStory from '../components/story/SessionStory'
import RoomsRail from '../components/story/RoomsRail'
import { IntroLoader } from '../components/ui/Loader'
import { startSmoothScroll, stopSmoothScroll } from '../lib/smoothScroll'

const SEEN_KEY = 'vocalize:intro-seen'

// The intro plays once per browser session; storage can throw in private modes.
function introSeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

export default function Landing() {
  const [loading, setLoading] = useState(() => !introSeen())
  // The navbar waits until the zoom has landed; reduced motion shows it at once.
  const [navShown, setNavShown] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* not remembered, plays again next visit */
    }
    setLoading(false)
  }, [])

  // Smooth scrolling lives only on the story page; the app screens scroll natively.
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
    startSmoothScroll()
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)
    document.fonts?.ready.then(onLoad)
    return () => {
      window.removeEventListener('load', onLoad)
      stopSmoothScroll()
    }
  }, [])

  return (
    <div className="min-h-screen bg-paper">
      <AnimatePresence>{loading && <IntroLoader onDone={finish} />}</AnimatePresence>
      <Navbar shown={navShown} />
      <main>
        <ZoomIntro ready={!loading} onLanded={setNavShown} />
        <WordFill />
        <SessionStory />
        <RoomsRail />
        <Features />
        <Gamification />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
