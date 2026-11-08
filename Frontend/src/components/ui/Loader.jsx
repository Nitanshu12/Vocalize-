import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'

/* The loader is the palette, standing up as a waveform: seven blocks in the
 * page's own colours rise like a voice level, the wordmark lands, then the
 * whole sheet lifts away to reveal the page. */

const BARS = [
  { h: 34, tone: 'bg-paper-deep' },
  { h: 62, tone: 'bg-olive' },
  { h: 100, tone: 'bg-accent' },
  { h: 48, tone: 'bg-accent-soft' },
  { h: 82, tone: 'bg-ink' },
  { h: 56, tone: 'bg-accent' },
  { h: 28, tone: 'bg-paper-deep' },
]

const EASE = [0.16, 1, 0.3, 1]

export function IntroLoader({ onDone }) {
  const reduced = useReducedMotion()

  useEffect(() => {
    const t = setTimeout(onDone, reduced ? 350 : 1750)
    return () => clearTimeout(t)
  }, [onDone, reduced])

  return (
    <motion.div
      key="intro-loader"
      role="status"
      aria-label="Loading Vocalize"
      className="fixed inset-0 z-[400] flex flex-col items-center justify-center bg-paper"
      initial={{ y: 0 }}
      exit={reduced ? { opacity: 0 } : { y: '-100%' }}
      transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="flex items-center gap-2 h-28" aria-hidden="true">
        {BARS.map((bar, i) => (
          <motion.span
            key={i}
            className={`block w-4 sm:w-5 rounded-md origin-center ${bar.tone}`}
            style={{ height: `${bar.h}%` }}
            initial={{ scaleY: 0.08, opacity: 0 }}
            animate={{ scaleY: [0.08, 1, 0.55, 1], opacity: 1 }}
            transition={{ duration: 1.1, delay: i * 0.06, ease: EASE, times: [0, 0.45, 0.7, 1] }}
          />
        ))}
      </div>
      <div className="overflow-hidden mt-8">
        <motion.p
          className="font-display text-4xl font-bold tracking-[-0.04em] text-ink"
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: EASE }}
        >
          Vocalize
        </motion.p>
      </div>
    </motion.div>
  )
}

/* Small in-app loader: the same blocks, breathing, with an optional line under them. */
export function WaveLoader({ label, className = '' }) {
  return (
    <div role="status" className={`flex flex-col items-center justify-center ${className}`}>
      <div className="flex items-center gap-1.5 h-12" aria-hidden="true">
        {BARS.map((bar, i) => (
          <span
            key={i}
            className={`wavebar block w-2.5 rounded-sm ${bar.tone}`}
            style={{ height: `${bar.h}%`, animationDelay: `${i * 0.11}s` }}
          />
        ))}
      </div>
      <p className={label ? 'mt-5 text-ink-soft' : 'sr-only'}>{label || 'Loading'}</p>
    </div>
  )
}
