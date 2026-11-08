import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* One Lenis instance for the landing page, driven by GSAP's ticker so that
 * every ScrollTrigger scrub reads the same smoothed scroll position. */
let lenis = null

export function startSmoothScroll() {
  if (lenis) return lenis
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return null

  lenis = new Lenis({ lerp: 0.1, anchors: { offset: 0 } })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return lenis
}

function tick(time) {
  lenis?.raf(time * 1000)
}

export function stopSmoothScroll() {
  if (!lenis) return
  gsap.ticker.remove(tick)
  lenis.destroy()
  lenis = null
}

export function scrollToTarget(target) {
  if (lenis) lenis.scrollTo(target, { duration: 1.4 })
  else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
}
