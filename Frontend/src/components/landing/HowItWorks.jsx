import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Reveal from '../ui/Reveal'

gsap.registerPlugin(ScrollTrigger)

const EASE = [0.16, 1, 0.3, 1]

const steps = [
  {
    title: 'You talk.',
    description: 'Pick a room, get a question or a topic, and speak. Two minutes is enough. Your browser records it, nothing to install.',
  },
  {
    title: 'We listen. Properly.',
    description: 'Every word transcribed, every pause measured, every “basically” caught with a timestamp. Then the AI reads your answer the way an interviewer would.',
  },
  {
    title: 'You get one thing.',
    description: 'Not twelve metrics and a dashboard. One specific thing to fix in your next session. Fix it, and we’ll give you the next one.',
  },
]

/* The five "basically" timestamps from a 1:42 answer. */
const MARKS = [
  { t: '0:07', s: 7 },
  { t: '0:23', s: 23 },
  { t: '0:41', s: 41 },
  { t: '1:02', s: 62 },
  { t: '1:19', s: 79 },
]
const LENGTH = 102

function StageTalk() {
  const bars = [30, 52, 76, 44, 90, 62, 100, 70, 38, 84, 56, 28, 66, 92, 48, 74, 40, 58, 86, 34]
  return (
    <div className="h-full flex flex-col justify-between p-7 lg:p-10">
      <div className="flex items-center justify-between">
        <p className="text-ink-soft">“Tell me about yourself”</p>
        <p className="font-display text-2xl font-bold text-ink tabular-nums">0:48</p>
      </div>
      <div className="flex items-center justify-between gap-1.5 h-40" aria-hidden="true">
        {bars.map((h, i) => (
          <span
            key={i}
            className="wavebar flex-1 rounded-sm bg-accent"
            style={{ height: `${h}%`, animationDelay: `${(i % 7) * 0.14}s` }}
          />
        ))}
      </div>
      <p className="text-sm text-ink-faint">Recording in your browser</p>
    </div>
  )
}

function StageListen() {
  return (
    <div className="h-full flex flex-col justify-between p-7 lg:p-10">
      <p className="font-display text-3xl lg:text-4xl font-bold tracking-[-0.035em] leading-tight text-ink max-w-sm">
        “basically”, 5 times in 90 seconds
      </p>
      <div>
        <div className="relative h-16">
          <div className="absolute inset-x-0 top-1/2 h-px bg-rule" />
          {MARKS.map((m, i) => (
            <motion.div
              key={m.t}
              className="absolute top-0 bottom-0 flex flex-col items-center"
              style={{ left: `${(m.s / LENGTH) * 100}%` }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.09, duration: 0.5, ease: EASE }}
            >
              <span className="w-[3px] flex-1 rounded-sm bg-coral" />
              <span className="mt-2 text-xs tabular-nums text-ink-soft -translate-x-1/2 ml-[1.5px] absolute top-full">{m.t}</span>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-ink-faint mt-8 tabular-nums">
          <span>0:00</span>
          <span>1:42</span>
        </div>
      </div>
    </div>
  )
}

function StageOneThing() {
  return (
    <div className="h-full grid grid-rows-[minmax(0,1fr)_auto] gap-2.5 p-2.5">
      <div className="rounded-[10px] bg-ink p-7 lg:p-10 flex flex-col justify-end">
        <p className="text-sm font-semibold text-accent-ink/70 mb-3">The one thing</p>
        <p className="font-display text-3xl lg:text-[2.6rem] font-bold tracking-[-0.035em] leading-[1.08] text-accent-ink">
          Swap “basically” for a half-second pause.
        </p>
      </div>
      <div className="rounded-[10px] bg-accent px-7 py-5 text-accent-ink font-medium">
        That’s it. Next session, just that.
      </div>
    </div>
  )
}

const STAGES = [StageTalk, StageListen, StageOneThing]

export default function HowItWorks() {
  const pinRef = useRef(null)
  const progressRef = useRef(null)
  const triggerRef = useRef(null)
  const [active, setActive] = useState(0)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const st = ScrollTrigger.create({
        trigger: pinRef.current,
        start: 'top top',
        end: '+=180%',
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          setActive(Math.min(steps.length - 1, Math.floor(self.progress * steps.length)))
          if (progressRef.current) progressRef.current.style.transform = `scaleY(${self.progress})`
        },
      })
      triggerRef.current = st
      return () => {
        triggerRef.current = null
        st.kill()
      }
    })
    return () => mm.revert()
  }, [])

  function choose(i) {
    const st = triggerRef.current
    if (st) {
      const y = st.start + ((i + 0.5) / steps.length) * (st.end - st.start)
      window.scrollTo({ top: y, behavior: 'smooth' })
    } else {
      setActive(i)
    }
  }

  const Stage = STAGES[active]

  return (
    <section id="how-it-works" className="bg-paper">
      <div ref={pinRef} className="lg:h-screen flex items-center py-[var(--section-gap-s)] lg:pt-[72px] lg:pb-0">
        <div className="shell w-full grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-12 lg:gap-16 items-center">
          <div className="min-w-0">
            <Reveal>
              <h2 className="font-display text-4xl xl:text-5xl font-bold tracking-[-0.04em] leading-[1.02] text-ink mb-4">Here’s exactly what happens</h2>
              <p className="lead max-w-md mb-8">
                Feedback only works when it’s specific, immediate, and small enough to act on.
                A session takes about three minutes.
              </p>
            </Reveal>

            <div className="relative pl-6">
              <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-sm bg-rule" aria-hidden="true" />
              <span
                ref={progressRef}
                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-sm bg-accent origin-top hidden lg:block"
                style={{ transform: 'scaleY(0)' }}
                aria-hidden="true"
              />
              <ol className="space-y-1">
                {steps.map(({ title, description }, i) => {
                  const on = i === active
                  return (
                    <li key={title}>
                      <button
                        type="button"
                        onClick={() => choose(i)}
                        aria-current={on ? 'step' : undefined}
                        className="w-full text-left rounded-control py-2.5"
                      >
                        <span className={`block font-display text-2xl xl:text-[1.75rem] font-bold tracking-[-0.03em] transition-colors duration-300 ${on ? 'text-ink' : 'text-ink-faint'}`}>
                          {title}
                        </span>
                        <span
                          className={`block leading-relaxed max-w-md mt-1.5 transition-colors duration-300 ${
                            on ? 'text-ink-soft' : 'text-ink-faint lg:text-ink-faint/60'
                          }`}
                        >
                          {description}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>

          <div className="relative min-w-0 aspect-[5/4] lg:aspect-auto lg:h-[min(520px,calc(100vh-150px))] rounded-card bg-paper-deep overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                className="absolute inset-0"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <Stage />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
