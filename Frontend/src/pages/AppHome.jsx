import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mic, Sparkles, Flame, Gauge } from 'lucide-react'
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
    body: 'Read it aloud — timed or relaxed, audio or on video.',
  },
  {
    n: 3,
    title: 'Get coached',
    body: 'Instant score, live pacing, and AI feedback on every attempt.',
  },
]

const TEASERS = [
  { icon: Gauge, label: 'Score out of 100' },
  { icon: Flame, label: 'Daily streaks' },
  { icon: Sparkles, label: 'AI speech coach' },
]

export default function AppHome() {
  const { user } = useAuth()
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'
  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="relative min-h-screen bg-paper grain overflow-hidden flex items-center justify-center px-6 py-14">
      {/* ambient teal glow, same motif as the hero */}
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] bg-brand-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-32 w-[420px] h-[420px] bg-brand-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl text-center animate-fade-up">
        {/* hero mark */}
        <div className="relative mx-auto mb-9 w-28 h-28 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-brand-100 animate-pulse" />
          <span className="absolute inset-3 rounded-full bg-white shadow-[0_8px_40px_rgba(14,124,134,0.2)]" />
          <Mic className="relative text-brand-700" size={40} strokeWidth={2} />
        </div>

        <p className="handnote text-2xl text-brand-700 mb-3">you're all set</p>
        <h1 className="font-display text-4xl lg:text-5xl font-semibold text-ink tracking-tight leading-[1.1] mb-4">
          Ready when you are, {firstName}.
        </h1>
        <p className="text-lg text-ink-soft leading-relaxed mb-10 max-w-md mx-auto">
          Your coach is warmed up. Let's turn your first few words into your first score.
        </p>

        {/* interactive 3-step strip */}
        <div className="grid sm:grid-cols-3 gap-3 mb-9 text-left">
          {STEPS.map((step, i) => (
            <button
              key={step.n}
              type="button"
              onMouseEnter={() => setActiveStep(i)}
              onFocus={() => setActiveStep(i)}
              className={`rounded-2xl border px-5 py-5 transition-all duration-200 ${
                activeStep === i
                  ? 'border-brand-600 bg-white shadow-[0_2px_20px_rgba(14,124,134,0.12)] -translate-y-0.5'
                  : 'border-ink/12 bg-white/60 hover:border-ink/30'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-display font-semibold text-sm mb-3 transition-colors ${
                  activeStep === i ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700'
                }`}
              >
                {step.n}
              </span>
              <span className="block font-display text-lg font-semibold text-ink mb-1">
                {step.title}
              </span>
              <span className="block text-sm text-ink-soft leading-snug">{step.body}</span>
            </button>
          ))}
        </div>

        {/* primary CTA */}
        <Link
          to="/app/practice"
          className="inline-flex items-center gap-2 px-9 py-4 rounded-full bg-ink text-paper font-semibold text-lg hover:gap-3.5 transition-all"
        >
          Start your first session <ArrowRight size={20} />
        </Link>

        {/* what you'll earn — teaser chips */}
        <div className="flex items-center justify-center gap-2 flex-wrap mt-8">
          {TEASERS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft bg-white border border-ink/10 rounded-full px-4 py-2"
            >
              <Icon size={15} className="text-brand-600" /> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
