import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Sparkles, Flame, Gauge } from 'lucide-react'
import { WaveMark } from '../components/ui/Waveform'
import { useAuth } from '../context/AuthContext'

/* The post-onboarding "launch pad". Its only job is to get a first-time user
 * excited and into their first practice session. No logout, no clutter — that
 * lives on the dashboard. Everything here points at one CTA. */

const STEPS = [
  {
    n: 1,
    title: 'Pick a script',
    body: 'Choose one of our curated paragraphs, or paste your own.',
  },
  {
    n: 2,
    title: 'Speak it out',
    body: 'Read it aloud, timed or relaxed, audio or on video.',
  },
  {
    n: 3,
    title: 'Get coached',
    body: 'Instant score, live pacing, and AI feedback on every attempt.',
  },
]

const EASE = [0.16, 1, 0.3, 1]

const TEASERS = [
  { icon: Gauge, label: 'Score out of 100' },
  { icon: Flame, label: 'Daily streaks' },
  { icon: Sparkles, label: 'AI speech coach' },
]

export default function AppHome() {
  const { user } = useAuth()
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'
  const [activeStep, setActiveStep] = useState(0)

  const tones = ['bg-accent text-accent-ink', 'bg-accent-soft text-accent-ink', 'bg-paper-deep text-ink']

  return (
    <div className="min-h-screen bg-paper flex items-center py-14">
      <div className="shell grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <WaveMark className="w-12 h-9 text-accent mb-10" animate />
          <h1 className="font-display text-5xl lg:text-6xl font-bold text-ink tracking-[-0.045em] leading-[1.02] mb-6">
            Ready when you are, {firstName}.
          </h1>
          <p className="lead max-w-md mb-10">
            Your coach is warmed up. Let's turn your first few words into your first score.
          </p>

          <Link to="/app/practice" className="btn btn-primary btn-lg">
            Start your first session <ArrowRight size={20} className="btn-arrow" />
          </Link>

          <ul className="flex flex-wrap gap-x-6 gap-y-3 mt-10">
            {TEASERS.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2 text-ink-soft">
                <Icon size={16} className="text-accent" /> {label}
              </li>
            ))}
          </ul>
        </motion.div>

        <ol className="grid gap-2.5">
          {STEPS.map((step, i) => {
            const on = activeStep === i
            return (
              <motion.li
                key={step.n}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: EASE }}
              >
                <button
                  type="button"
                  onMouseEnter={() => setActiveStep(i)}
                  onFocus={() => setActiveStep(i)}
                  aria-current={on ? 'step' : undefined}
                  className={`w-full text-left rounded-card px-7 py-6 grid grid-cols-[3rem_minmax(0,1fr)] gap-4 items-baseline transition-[background-color,color,transform] duration-300 ease-out ${
                    on ? `${tones[i]} lg:-translate-x-2` : 'bg-surface text-ink'
                  }`}
                >
                  <span className="font-display text-4xl font-bold tracking-[-0.04em] leading-none tabular-nums">{step.n}</span>
                  <span>
                    <span className="block font-display text-2xl font-bold tracking-[-0.03em] mb-1">{step.title}</span>
                    <span className={`block leading-snug ${on ? 'opacity-80' : 'text-ink-soft'}`}>{step.body}</span>
                  </span>
                </button>
              </motion.li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
