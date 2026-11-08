import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* Chapter three: a session, told in three scenes on one pinned stage.
 * Your voice becomes words, the coach marks them up, and then the one word
 * that matters opens into the one thing to fix. */

const SCENES = [
  {
    title: 'You talk.',
    body: 'Pick a room, get a question or a topic, and speak. Two minutes is enough. Your browser records it, nothing to install.',
  },
  {
    title: 'We listen. Properly.',
    body: 'Every word transcribed, every pause measured, every “basically” caught with a timestamp. Then the AI reads your answer the way an interviewer would.',
  },
  {
    title: 'You get one thing.',
    body: 'Not twelve metrics and a dashboard. One specific thing to fix in your next session. Fix it, and we’ll give you the next one.',
  },
]

const BARS = [30, 52, 76, 44, 90, 62, 100, 70, 38, 84, 56, 28, 66, 92, 48, 74, 40, 58, 86, 34, 60, 80]
const MARKS = [
  { t: '0:07', s: 7 },
  { t: '0:23', s: 23 },
  { t: '0:41', s: 41 },
  { t: '1:02', s: 62 },
  { t: '1:19', s: 79 },
]

function OneThing() {
  return (
    <>
      <p data-one className="text-sm font-semibold text-accent-ink/70 mb-3">The one thing</p>
      <p data-one className="font-display font-bold tracking-[-0.04em] leading-[1.02] text-accent-ink text-[clamp(1.9rem,3.2vw+0.5rem,3.6rem)]">
        Swap “basically” for a half-second pause.
      </p>
      <p data-one className="mt-5 text-accent-ink/80 text-lg">That’s it. Next session, just that.</p>
    </>
  )
}

export default function SessionStory() {
  const root = useRef(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.set('[data-cap]:not([data-cap="0"])', { autoAlpha: 0, y: 30 })
        gsap.set('[data-seg]', { scaleX: 0 })
        gsap.set('[data-seg="0"]', { scaleX: 1 })
        gsap.set('[data-tline]', { autoAlpha: 0, y: 24 })
        gsap.set('[data-circle]', { strokeDashoffset: 1 })
        gsap.set('[data-wavy]', { clipPath: 'inset(0 100% 0 0)' })
        gsap.set('[data-note]', { autoAlpha: 0, y: 8 })
        gsap.set('[data-mark]', { autoAlpha: 0, scaleY: 0 })
        gsap.set('[data-onelayer]', { clipPath: 'circle(0% at 16% 24%)' })
        gsap.set('[data-one]', { autoAlpha: 0, y: 30 })

        const cap = (from, to, at) =>
          tl
            .to(`[data-cap="${from}"]`, { autoAlpha: 0, y: -30, duration: 0.06 }, at)
            .to(`[data-cap="${to}"]`, { autoAlpha: 1, y: 0, duration: 0.08 }, at + 0.05)
            .to(`[data-seg="${to}"]`, { scaleX: 1, duration: 0.12 }, at)

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=320%',
            pin: true,
            scrub: 0.6,
          },
        })

        // Scene 1 to 2: the voice collapses into a line of words.
        tl.to('[data-bar]', { scaleY: 0.02, autoAlpha: 0, duration: 0.12, stagger: { each: 0.004, from: 'center' } }, 0.08)
        cap(0, 1, 0.1)
        tl.to('[data-tline]', { autoAlpha: 1, y: 0, duration: 0.08, stagger: 0.04 }, 0.16)
          // The coach's pen.
          .to('[data-circle]', { strokeDashoffset: 0, duration: 0.08 }, 0.27)
          .to('[data-note="0"]', { autoAlpha: 1, y: 0, duration: 0.04 }, 0.33)
          .to('[data-wavy]', { clipPath: 'inset(0 0% 0 0)', duration: 0.08 }, 0.36)
          .to('[data-note="1"]', { autoAlpha: 1, y: 0, duration: 0.04 }, 0.43)
          .to('[data-note="2"]', { autoAlpha: 1, y: 0, duration: 0.04 }, 0.47)
          .to('[data-mark]', { autoAlpha: 1, scaleY: 1, duration: 0.03, stagger: 0.018, ease: 'back.out(2)' }, 0.5)
        // Scene 2 to 3: the circled word opens into the one thing.
        cap(1, 2, 0.62)
        tl.to('[data-onelayer]', { clipPath: 'circle(150% at 16% 24%)', duration: 0.18, ease: 'power2.in' }, 0.62)
          .to('[data-one]', { autoAlpha: 1, y: 0, duration: 0.08, stagger: 0.03, ease: 'power2.out' }, 0.78)
          .to({}, { duration: 0.08 })
      }, root)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  return (
    <section id="how-it-works" ref={root} className="relative bg-paper motion-safe:h-[100svh] motion-safe:overflow-hidden">
      <div className="shell h-full grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-8 lg:gap-16 content-center items-center pt-[88px] pb-8 lg:pb-0 motion-reduce:py-[var(--section-gap-s)]">
        {/* captions */}
        <div className="min-w-0">
          <h2 className="text-ink-soft mb-5 lg:mb-8">A session, in three scenes</h2>
          <div className="flex gap-1.5 mb-6 lg:mb-10 max-w-[240px] motion-reduce:hidden" aria-hidden="true">
            {SCENES.map((_, i) => (
              <span key={i} className="flex-1 h-1 rounded-sm bg-paper-deep overflow-hidden">
                <span data-seg={i} className="block h-full bg-accent origin-left" />
              </span>
            ))}
          </div>
          <ol className="relative motion-safe:min-h-[11rem] lg:motion-safe:min-h-[14rem] motion-reduce:space-y-8">
            {SCENES.map(({ title, body }, i) => (
              <li key={title} data-cap={i} className="motion-safe:absolute motion-safe:inset-x-0 motion-safe:top-0">
                <p className="font-display text-[clamp(2rem,3vw+0.75rem,3.5rem)] font-bold tracking-[-0.04em] leading-[1.02] text-ink mb-3 lg:mb-5">
                  {title}
                </p>
                <p className="lead max-w-md">{body}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* the stage */}
        <div className="relative min-w-0 w-full h-[46svh] lg:h-auto lg:aspect-[5/4] lg:max-h-[72svh] rounded-card bg-paper-deep overflow-hidden">
          {/* scene 1: the voice */}
          <div className="absolute inset-0 flex items-center justify-center gap-[0.6%] px-[8%] motion-reduce:hidden" aria-hidden="true">
            {BARS.map((h, i) => (
              <span key={i} data-bar className="block flex-1 origin-center" style={{ height: `${h * 0.55}%` }}>
                <span className="wavebar block h-full rounded-sm bg-accent" style={{ animationDelay: `${(i % 7) * 0.14}s` }} />
              </span>
            ))}
          </div>

          {/* scene 2: the words, marked up */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10">
            <div className="text-[15px] sm:text-lg leading-[2.2] text-ink-soft max-w-[34rem]">
              <p data-tline>
                So{' '}
                <span className="relative inline-block px-1 text-coral font-semibold">
                  basically
                  <svg className="absolute -left-2 -top-1.5 w-[calc(100%+16px)] h-[calc(100%+12px)] overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
                    <ellipse data-circle cx="50" cy="20" rx="48" ry="17" fill="none" strokeWidth="2.5" className="stroke-coral" pathLength="1" strokeDasharray="1" />
                  </svg>
                  <span data-note="0" className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs sm:text-sm font-semibold text-coral whitespace-nowrap">
                    third time
                  </span>
                </span>{' '}
                I’m a final year student and
              </p>
              <p data-tline className="relative inline-block">
                <span data-wavy className="underline decoration-wavy decoration-gold decoration-2 underline-offset-[7px]">
                  I-did-my-schooling-from-Bhopal-then-I…
                </span>
                <span data-note="1" className="absolute -bottom-6 right-0 text-xs sm:text-sm font-semibold text-gold whitespace-nowrap">
                  breathe, slow down
                </span>
              </p>
              <p data-tline className="mt-6">
                …what I really care about is building things people{' '}
                <span className="relative font-semibold text-ink">
                  actually use.
                  <span data-note="2" className="absolute -bottom-6 right-0 text-xs sm:text-sm font-semibold text-leaf whitespace-nowrap">
                    strong close
                  </span>
                </span>
              </p>
            </div>

            <div data-tline aria-label="“basically” at 0:07, 0:23, 0:41, 1:02 and 1:19">
              <div className="relative h-10">
                <div className="absolute inset-x-0 top-1/2 h-px bg-rule" />
                {MARKS.map((m) => (
                  <span
                    key={m.t}
                    data-mark
                    className="absolute top-0 bottom-0 w-[3px] -ml-[1.5px] rounded-sm bg-coral origin-center"
                    style={{ left: `${(m.s / 102) * 100}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-ink-faint mt-2 tabular-nums">
                <span>0:00</span>
                <span>“basically”, 5 times</span>
                <span>1:42</span>
              </div>
            </div>
          </div>

          {/* scene 3: the one thing, opening out of the circled word */}
          <div data-onelayer className="absolute inset-0 bg-ink flex flex-col justify-end p-6 sm:p-10 motion-reduce:hidden">
            <OneThing />
          </div>
        </div>

        {/* reduced motion: the one thing as its own block */}
        <div className="hidden motion-reduce:block lg:col-start-2 rounded-card bg-ink p-8">
          <OneThing />
        </div>
      </div>
    </section>
  )
}
