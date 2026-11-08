import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { WaveMark } from '../ui/Waveform'

const EASE = [0.16, 1, 0.3, 1]
const BLOCKS = [
  { h: 38, tone: 'bg-paper' },
  { h: 64, tone: 'bg-olive' },
  { h: 100, tone: 'bg-accent' },
  { h: 52, tone: 'bg-accent-soft' },
  { h: 80, tone: 'bg-ink' },
  { h: 58, tone: 'bg-accent' },
  { h: 30, tone: 'bg-olive' },
]

export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bg-paper p-0 lg:p-3 gap-3">
      {/* Left: the brand panel, hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between rounded-card bg-paper-deep p-12">
        <Link to="/" className="flex items-center gap-3 self-start rounded-control">
          <WaveMark className="w-8 h-6 text-accent" />
          <span className="font-display text-xl font-bold tracking-[-0.03em] text-ink">Vocalize</span>
        </Link>

        <div>
          <div className="flex items-end gap-2 h-32 mb-12" aria-hidden="true">
            {BLOCKS.map((b, i) => (
              <motion.span
                key={i}
                className={`block w-6 rounded-md origin-bottom ${b.tone}`}
                style={{ height: `${b.h}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.06, ease: EASE }}
              />
            ))}
          </div>
          <h2 className="font-display text-5xl font-bold text-ink leading-[1.02] tracking-[-0.045em] max-w-md mb-6">
            You rehearse in your head. The interview happens out loud.
          </h2>
          <p className="text-ink-soft">No credit card. No judgement. Just you, out loud.</p>
        </div>

        <p className="text-sm text-ink-faint">© {new Date().getFullYear()} Vocalize</p>
      </div>

      {/* Right: the form */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16">
        <Link to="/" className="lg:hidden flex items-center gap-3 mb-12 self-start rounded-control">
          <WaveMark className="w-8 h-6 text-accent" />
          <span className="font-display text-xl font-bold tracking-[-0.03em] text-ink">Vocalize</span>
        </Link>

        <motion.div
          className="max-w-sm w-full mx-auto lg:mx-0"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <h1 className="font-display text-4xl font-bold text-ink tracking-[-0.04em] leading-[1.05] mb-3">{title}</h1>
          {subtitle && <p className={`text-ink-soft ${eyebrow ? 'mb-2' : 'mb-9'}`}>{subtitle}</p>}
          {eyebrow && <p className="text-sm text-accent mb-9">{eyebrow}</p>}

          {children}
        </motion.div>
      </div>
    </div>
  )
}
