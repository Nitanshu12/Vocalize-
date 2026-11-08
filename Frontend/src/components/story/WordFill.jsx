import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* Chapter two, in three beats on one pinned screen:
 *   1. What your friends say drops in, then falls away: it was never feedback.
 *   2. Your mirror shows the line back, then its reflection empties word by word.
 *   3. Vocalize says the rest: a khaki highlighter reads it out, word by word,
 *      like captions on a voice, with the voice under it. */

const FRIENDS = 'Your friends say “that was good, yaar.”'.split(' ')
const MIRROR = 'Your mirror says nothing.'.split(' ')
const VOCALIZE = 'Vocalize tells you what an interviewer notices but never says out loud.'.split(' ')
const VOICE = [30, 55, 80, 45, 100, 65, 35, 85, 50, 70, 95, 40, 60, 90, 30, 75, 55, 85, 45, 65, 35, 80, 50, 70]

const SIZE = 'font-display font-bold tracking-[-0.045em] leading-[1.06] text-[clamp(2.1rem,4.6vw+0.5rem,5.25rem)]'

export default function WordFill() {
  const root = useRef(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.set('[data-friend]', { autoAlpha: 0, yPercent: -80, rotate: -6, filter: 'blur(10px)' })
        gsap.set('[data-beat="2"]', { autoAlpha: 0, scale: 0.92, filter: 'blur(14px)' })
        gsap.set('[data-beat="3"]', { autoAlpha: 0 })
        gsap.set('[data-said]', { opacity: 0.16 })
        gsap.set('[data-voice]', { scaleY: 0.1, autoAlpha: 0 })

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=380%',
            pin: true,
            scrub: 0.6,
          },
        })

        // Beat 1: dropped in, then let go.
        tl.to('[data-friend]', {
          autoAlpha: 1, yPercent: 0, rotate: 0, filter: 'blur(0px)',
          duration: 0.05, stagger: 0.022, ease: 'back.out(1.6)',
        }, 0.02)
          .to('[data-friend]', {
            autoAlpha: 0, yPercent: 120, rotate: 8, filter: 'blur(6px)',
            duration: 0.05, stagger: { each: 0.012, from: 'random' }, ease: 'power2.in',
          }, 0.24)

        // Beat 2: the mirror, and its empty reflection.
          .to('[data-beat="2"]', { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.08, ease: 'power2.out' }, 0.32)
          .to('[data-reflect]', { autoAlpha: 0, filter: 'blur(12px)', y: 16, duration: 0.04, stagger: 0.025 }, 0.42)
          .to('[data-beat="2"]', { autoAlpha: 0, scale: 1.08, filter: 'blur(14px)', duration: 0.05, ease: 'power2.in' }, 0.54)

        // Beat 3: Vocalize reads it out, word by word.
          .to('[data-beat="3"]', { autoAlpha: 1, duration: 0.04 }, 0.58)
          .to('[data-voice]', { scaleY: 1, autoAlpha: 1, duration: 0.06, stagger: { each: 0.003, from: 'center' } }, 0.58)

        const words = gsap.utils.toArray('[data-spoken]')
        const start = 0.64
        const step = 0.3 / words.length
        words.forEach((w, i) => {
          const at = start + i * step
          tl.to(w.querySelector('[data-mark]'), { clipPath: 'inset(0% 0% 0% 0%)', duration: step * 0.9 }, at)
            .to(w.querySelector('[data-said]'), { opacity: 1, duration: step * 0.9 }, at)
            .to(w.querySelector('[data-mark]'), { clipPath: 'inset(0% 0% 0% 100%)', duration: step * 1.2 }, at + step * 1.1)
        })
        tl.to({}, { duration: 0.05 })
      }, root)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  return (
    <section
      id="story"
      ref={root}
      className="relative bg-paper motion-safe:h-[100svh] motion-safe:overflow-hidden motion-reduce:py-[var(--section-gap)]"
    >
      <div className="shell h-full relative motion-reduce:space-y-10">
        {/* Beat 1 */}
        <p data-beat="1" className={`${SIZE} text-ink-soft motion-safe:absolute motion-safe:inset-0 flex flex-wrap content-center justify-center text-center px-[var(--gutter)]`}>
          {FRIENDS.map((w, i) => (
            <span key={i} data-friend className="inline-block mr-[0.24em]">{w}</span>
          ))}
        </p>

        {/* Beat 2 */}
        <div data-beat="2" className="motion-safe:absolute motion-safe:inset-0 flex flex-col items-center justify-center text-center">
          <p className={`${SIZE} text-ink`}>Your mirror says nothing.</p>
          <p
            className={`${SIZE} text-ink -scale-y-100 opacity-30 mt-1 select-none motion-reduce:hidden [mask-image:linear-gradient(to_top,black,transparent_75%)]`}
            aria-hidden="true"
          >
            {MIRROR.map((w, i) => (
              <span key={i} data-reflect className="inline-block mr-[0.24em]">{w}</span>
            ))}
          </p>
        </div>

        {/* Beat 3 */}
        <div data-beat="3" className="motion-safe:absolute motion-safe:inset-0 flex flex-col items-center justify-center text-center">
          <p className={`${SIZE} max-w-[18ch] text-accent`}>
            {VOCALIZE.map((w, i) => (
              <span key={i} data-spoken className="relative inline-block mr-[0.24em]">
                <span data-said>{w}</span>
                <span
                  data-mark
                  className="absolute -inset-x-[0.12em] -inset-y-[0.02em] rounded-md bg-accent text-accent-ink px-[0.12em] motion-reduce:hidden"
                  style={{ clipPath: 'inset(0% 100% 0% 0%)' }}
                  aria-hidden="true"
                >
                  {w}
                </span>
              </span>
            ))}
          </p>
          <div className="flex items-center gap-[4px] h-14 mt-12 motion-reduce:hidden" aria-hidden="true">
            {VOICE.map((h, i) => (
              <span key={i} data-voice className="block origin-center" style={{ height: `${h}%` }}>
                <span className="wavebar block h-full w-[5px] rounded-sm bg-accent/70" style={{ animationDelay: `${(i % 8) * 0.12}s` }} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
