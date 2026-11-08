import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'

const EASE = [0.16, 1, 0.3, 1]
const HEAD = ['The interview', 'happens', 'out loud.']

/* Five live bars in the khaki block: a voice level, breathing. */
function LevelBars({ count = 9 }) {
  const heights = [40, 72, 100, 58, 86, 44, 92, 64, 36, 78, 52]
  return (
    <div className="flex items-center gap-[6px] h-full" aria-hidden="true">
      {heights.slice(0, count).map((h, i) => (
        <span
          key={i}
          className="wavebar block w-[7px] rounded-sm bg-accent-ink/85"
          style={{ height: `${h}%`, animationDelay: `${i * 0.13}s` }}
        />
      ))}
    </div>
  )
}

/* The signature: a spoken answer, marked up by a coach as you watch. */
function MarkedTranscript({ ready }) {
  const at = (s) => ({ duration: 0.6, delay: ready ? s : 0, ease: EASE })
  const show = ready ? 'show' : 'hidden'
  const note = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0 },
  }
  return (
    <div className="relative h-full flex flex-col justify-between p-6 lg:p-7">
      <p className="text-[15px] lg:text-base leading-[2.15] text-ink-soft">
        So{' '}
        <span className="relative inline-block px-1 text-coral font-semibold">
          basically
          <svg className="absolute -inset-x-1.5 -inset-y-1 w-[calc(100%+12px)] h-[calc(100%+8px)] overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            <motion.ellipse
              cx="50" cy="20" rx="48" ry="17"
              fill="none" strokeWidth="2.5" className="stroke-coral"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: ready ? 1 : 0 }}
              transition={at(1.15)}
            />
          </svg>
          <motion.span
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-coral whitespace-nowrap"
            variants={note} initial="hidden" animate={show} transition={at(1.5)}
          >
            third time
          </motion.span>
        </span>{' '}
        I’m a final year student and{' '}
        <span className="relative">
          <span className="underline decoration-wavy decoration-gold/80 decoration-2 underline-offset-[6px]">
            I-did-my-schooling-from-Bhopal-then-I…
          </span>
          <motion.span
            className="absolute -bottom-7 right-0 text-xs font-semibold text-gold whitespace-nowrap"
            variants={note} initial="hidden" animate={show} transition={at(1.8)}
          >
            breathe, slow down
          </motion.span>
        </span>
      </p>

      <p className="text-[15px] lg:text-base leading-[2.15] text-ink-soft">
        …what I really care about is building things people{' '}
        <span className="relative font-semibold text-ink">
          actually use.
          <motion.span
            className="absolute -bottom-7 right-0 text-xs font-semibold text-leaf whitespace-nowrap"
            variants={note} initial="hidden" animate={show} transition={at(2.1)}
          >
            strong close
          </motion.span>
        </span>
      </p>
    </div>
  )
}

function Block({ area, className = '', ready, i, children }) {
  return (
    <motion.div
      className={`rounded-card overflow-hidden ${className}`}
      style={{ gridArea: area }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.8, delay: 0.25 + i * 0.08, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

function SessionMosaic({ ready }) {
  return (
    <div
      className="hidden lg:grid w-full h-[560px] gap-2.5"
      style={{
        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
        gridTemplateRows: '64px repeat(3, minmax(0, 1fr)) 120px',
        gridTemplateAreas: `
          "q q q q q q . . w w w w"
          "t t t t t t t t w w w w"
          "t t t t t t t t s s s s"
          "t t t t t t t t s s s s"
          "m m o o o o o o o o o o"`,
      }}
    >
      <Block area="q" i={0} ready={ready} className="bg-surface flex items-center justify-between px-5">
        <span className="text-sm text-ink-soft">“Tell me about yourself”</span>
        <span className="font-display font-semibold text-ink tabular-nums">1:42</span>
      </Block>
      <Block area="w" i={1} ready={ready} className="bg-accent p-5 flex flex-col justify-between">
        <span className="text-sm font-semibold text-accent-ink">Listening</span>
        <div className="h-20"><LevelBars count={11} /></div>
      </Block>
      <Block area="t" i={2} ready={ready} className="bg-paper-deep">
        <MarkedTranscript ready={ready} />
      </Block>
      <Block area="s" i={3} ready={ready} className="bg-accent-soft p-5 flex flex-col justify-end">
        <p className="font-display text-2xl font-bold leading-tight text-accent-ink tracking-[-0.03em]">STAR structure: complete</p>
        <p className="text-sm text-accent-ink/75 mt-2">situation, task, action, result</p>
      </Block>
      <Block area="m" i={4} ready={ready} className="bg-olive" />
      <Block area="o" i={5} ready={ready} className="bg-ink p-5 flex flex-col justify-center">
        <p className="text-sm font-semibold text-accent-ink/70 mb-1">The one thing</p>
        <p className="text-accent-ink font-medium leading-snug">
          Swap “basically” for a half-second pause. Next session, just that.
        </p>
      </Block>
    </div>
  )
}

/* Phone and tablet: the transcript and the one thing, stacked. */
function SessionStack({ ready }) {
  return (
    <motion.div
      className="lg:hidden grid gap-2.5"
      initial={{ opacity: 0, y: 16 }}
      animate={ready ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
    >
      <div className="rounded-card bg-paper-deep min-h-[260px]"><MarkedTranscript ready={ready} /></div>
      <div className="rounded-card bg-ink p-5">
        <p className="text-sm font-semibold text-accent-ink/70 mb-1">The one thing</p>
        <p className="text-accent-ink font-medium leading-snug">Swap “basically” for a half-second pause.</p>
      </div>
    </motion.div>
  )
}

export default function Hero({ ready = true }) {
  return (
    <section className="relative pt-[72px]">
      <div className="shell min-h-[calc(100svh-72px)] grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-12 lg:gap-16 items-center py-14 lg:py-10">
        <div className="min-w-0">
          <h1 className="display-xl text-ink">
            {HEAD.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <motion.span
                  className="block"
                  initial={{ y: '105%' }}
                  animate={ready ? { y: 0 } : { y: '105%' }}
                  transition={{ duration: 0.9, delay: 0.1 + i * 0.1, ease: EASE }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
          >
            <p className="lead mt-8 max-w-[30rem]">
              Vocalize listens while you practice, then names the one thing to fix.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-10">
              <Link to="/register" className="btn btn-primary btn-lg">
                Start speaking <ArrowRight size={18} className="btn-arrow" />
              </Link>
              <a href="#how-it-works" className="btn btn-secondary btn-lg">
                How a session goes
              </a>
            </div>

            <p className="text-sm text-ink-faint mt-6">No credit card. No judgement. Just you, out loud.</p>
          </motion.div>
        </div>

        <div className="min-w-0">
          <SessionMosaic ready={ready} />
          <SessionStack ready={ready} />
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-6 inset-x-0">
      <div className="shell">
      <motion.a
        href="#modes"
        className="inline-flex items-center gap-3 text-sm text-ink-soft rounded-sm"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <span className="relative w-5 h-8 rounded-full border-2 border-ink-soft" aria-hidden="true">
          <motion.span
            className="absolute left-1/2 top-1.5 -ml-[1.5px] w-[3px] h-2 rounded-full bg-ink-soft"
            animate={{ y: [0, 8, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
        Scroll to see the rooms
      </motion.a>
      </div>
      </div>
    </section>
  )
}
