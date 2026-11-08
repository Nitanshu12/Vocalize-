import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* Chapter one. The page opens on a voice: eight bars in the palette, and the
 * thought everyone has before an interview. Scrolling flies the camera into
 * the gap at the centre of the waveform; on the other side each word of the
 * line flies in from the camera and settles, centred: the interview happens
 * out loud. Only then does the navbar arrive. */

const BARS = [
  { h: 34, tone: 'bg-paper-deep' },
  { h: 58, tone: 'bg-olive' },
  { h: 82, tone: 'bg-accent' },
  { h: 100, tone: 'bg-accent-soft' },
  { h: 92, tone: 'bg-ink' },
  { h: 70, tone: 'bg-accent' },
  { h: 48, tone: 'bg-olive' },
  { h: 28, tone: 'bg-paper-deep' },
]
const HEAD = [['The', 'interview'], ['happens'], ['out', 'loud.']]
const UNDER = [30, 55, 80, 100, 70, 45, 85, 60, 35, 75, 50, 25, 65, 90, 40]

export default function ZoomIntro({ ready = true, onLanded }) {
  const root = useRef(null)
  const landed = useRef(null)
  const onLandedRef = useRef(onLanded)
  onLandedRef.current = onLanded

  // Scroll-driven zoom, pinned. Built once; only runs where motion is welcome.
  useLayoutEffect(() => {
    const report = (value) => {
      if (landed.current === value) return
      landed.current = value
      onLandedRef.current?.(value)
    }
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      report(false)
      const ctx = gsap.context(() => {
        gsap.set('[data-scene="b"]', { autoAlpha: 0 })
        gsap.set('[data-word]', { autoAlpha: 0, scale: 2.4, filter: 'blur(18px)', yPercent: 30 })
        gsap.set('[data-under]', { scaleY: 0 })
        gsap.set('[data-sub]', { autoAlpha: 0, y: 30, filter: 'blur(8px)' })

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=260%',
            pin: true,
            scrub: 0.6,
            onUpdate: (self) => report(self.progress > 0.9),
          },
        })

        tl.to('[data-lead]', { autoAlpha: 0, y: -60, filter: 'blur(10px)', duration: 0.14 }, 0)
          .to('[data-hint]', { autoAlpha: 0, duration: 0.06 }, 0)
          .to('[data-wave]', { scale: 110, duration: 0.5, ease: 'power3.in' }, 0.02)
          .to('[data-wave]', { autoAlpha: 0, duration: 0.06 }, 0.46)
          .set('[data-scene="b"]', { autoAlpha: 1 }, 0.46)
          // Each word flies in from the camera and settles.
          .to('[data-word]', {
            autoAlpha: 1,
            scale: 1,
            yPercent: 0,
            filter: 'blur(0px)',
            duration: 0.16,
            stagger: 0.045,
            ease: 'power3.out',
          }, 0.48)
          // A voice line draws under it, then the promise.
          .to('[data-under]', { scaleY: 1, duration: 0.08, stagger: { each: 0.006, from: 'center' }, ease: 'back.out(2)' }, 0.78)
          .to('[data-sub]', { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.1, ease: 'power2.out' }, 0.84)
          .to({}, { duration: 0.08 })
      }, root)
      return () => ctx.revert()
    })
    mm.add('(prefers-reduced-motion: reduce)', () => report(true))
    return () => mm.revert()
  }, [])

  // Entrance once the loader lifts: the bars stand up, the lead line arrives.
  useLayoutEffect(() => {
    if (!ready || !root.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.from('[data-bar]', { scaleY: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out' })
      gsap.from('[data-lead]', { autoAlpha: 0, y: 30, duration: 1, delay: 0.25, ease: 'expo.out' })
      gsap.from('[data-hint]', { autoAlpha: 0, duration: 0.8, delay: 0.9 })
    }, root)
    return () => ctx.revert()
  }, [ready])

  return (
    <section id="top" ref={root} className="relative h-[100svh] overflow-hidden bg-paper">
      {/* Scene A: the thought, and the voice */}
      <div data-scene="a" className="absolute inset-0 flex flex-col items-center justify-center px-4 motion-reduce:hidden">
        <p data-lead className="display-section text-ink-soft text-center max-w-[14ch] sm:max-w-none mb-10 sm:mb-14">
          You rehearse in your head.
        </p>
        <div
          data-wave
          className="flex items-center gap-2 sm:gap-3 h-[34vh] sm:h-[40vh] origin-center will-change-transform"
          aria-hidden="true"
        >
          {BARS.map((b, i) => (
            <span key={i} data-bar className="block h-full origin-center" style={{ height: `${b.h}%` }}>
              <span
                className={`wavebar block h-full w-6 sm:w-10 lg:w-12 rounded-lg ${b.tone}`}
                style={{ animationDelay: `${i * 0.13}s`, animationDuration: '2.2s' }}
              />
            </span>
          ))}
        </div>
        <p data-hint className="absolute bottom-8 inset-x-0 flex items-center justify-center gap-3 text-sm text-ink-soft">
          <span className="relative w-5 h-8 rounded-full border-2 border-ink-soft" aria-hidden="true">
            <span className="absolute left-1/2 top-1.5 -ml-[1.5px] w-[3px] h-2 rounded-full bg-ink-soft animate-[scrollHint_1.8s_ease-in-out_infinite]" />
          </span>
          Scroll to say it out loud
        </p>
      </div>

      {/* Scene B: the line, on the other side of the voice, centred */}
      <div data-scene="b" className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-display font-bold text-ink tracking-[-0.055em] leading-[0.9] text-[clamp(3.5rem,11vw+0.5rem,11rem)]">
          {HEAD.map((line, li) => (
            <span key={li} className="block">
              {line.map((w, wi) => (
                <span key={wi} data-word className={`inline-block will-change-transform ${li === 2 ? 'text-accent' : ''}`}>
                  {w}
                  {wi < line.length - 1 ? ' ' : ''}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <div className="flex items-center gap-[5px] h-10 mt-10 sm:mt-12" aria-hidden="true">
          {UNDER.map((h, i) => (
            <span key={i} data-under className="block h-full origin-center" style={{ height: `${h}%` }}>
              <span className="wavebar block h-full w-[5px] rounded-sm bg-accent" style={{ animationDelay: `${i * 0.11}s` }} />
            </span>
          ))}
        </div>
        <p data-sub className="mt-8 font-display font-semibold tracking-[-0.03em] text-ink-soft text-[clamp(1.35rem,1.6vw+0.9rem,2.25rem)]">
          Vocalize truly listens to you.
        </p>
      </div>
    </section>
  )
}
