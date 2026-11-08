import { useLayoutEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { WaveMark } from '../ui/Waveform'

gsap.registerPlugin(ScrollTrigger)

/* The last chapter: a khaki window that opens to fill the screen as you reach it. */
export default function CTA() {
  const root = useRef(null)
  const panel = useRef(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          panel.current,
          { clipPath: 'inset(14% 10% 14% 10% round 28px)' },
          {
            clipPath: 'inset(0% 0% 0% 0% round 0px)',
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'top top', scrub: 0.6 },
          }
        )
        gsap.from('[data-cta-line]', {
          yPercent: 110,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top 40%', end: 'top top', scrub: 0.6 },
        })
      }, root)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  return (
    <section id="start" ref={root} className="relative">
      <div
        ref={panel}
        className="min-h-[100svh] bg-accent text-accent-ink flex items-center motion-reduce:rounded-card"
        style={{ '--color-focus': 'var(--color-accent-ink)' }}
      >
        <div className="shell py-24">
          <WaveMark className="w-16 h-12 mb-12 text-accent-ink" animate />
          <h2 className="font-display font-bold tracking-[-0.05em] leading-[0.95] text-[clamp(2.75rem,6vw+0.5rem,7rem)] max-w-[14ch]">
            <span className="block overflow-hidden pb-[0.06em]"><span data-cta-line className="block">Your next interview</span></span>
            <span className="block overflow-hidden pb-[0.06em]"><span data-cta-line className="block">shouldn’t be your practice.</span></span>
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 mt-12">
            <Link to="/register" className="btn btn-lg bg-accent-ink text-ink hover:bg-paper-deep self-start">
              Start speaking, it’s free <ArrowRight size={18} className="btn-arrow" />
            </Link>
            <p className="text-accent-ink/75 max-w-sm">Two minutes, out loud, today. No credit card, no trial timer, no catch.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
