import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { WaveMark } from '../ui/Waveform'

/* Hand-drawn underline stroke (slightly wobbly on purpose) */
function CoachUnderline({ children }) {
  return (
    <span className="coach-underline">
      {children}
      <svg viewBox="0 0 200 12" preserveAspectRatio="none">
        <path
          d="M3 8 C 40 3, 80 10, 120 6 S 185 4, 197 7"
          fill="none"
          stroke="#7c3aed"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

/* The signature visual: a transcript marked up like a coach took a red pen to it */
function MarkedTranscript() {
  return (
    <div className="relative bg-white rounded-2xl border border-ink/10 shadow-[0_2px_24px_rgba(28,25,23,0.08)] p-7 max-w-md rotate-[1.2deg]">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-ink/10 border-dashed">
        <div>
          <p className="text-xs text-ink-faint font-medium uppercase tracking-wider">Your answer</p>
          <p className="text-sm font-semibold text-ink mt-0.5">"Tell me about yourself" · 1:42</p>
        </div>
        <WaveMark className="w-8 h-6" animate />
      </div>

      {/* Transcript with coach markup */}
      <p className="text-[15px] leading-[2.1] text-ink-soft">
        So{' '}
        <span className="relative inline-block px-1.5 border-2 border-coral rounded-full text-coral font-medium">
          basically
          <span className="handnote absolute -top-6 left-1/2 -translate-x-1/2 text-coral text-base whitespace-nowrap">
            3rd time ↓
          </span>
        </span>{' '}
        I'm a final year student and{' '}
        <span className="relative border-b-[3px] border-gold/70" style={{ borderBottomStyle: 'wavy' }}>
          I-did-my-schooling-from-Bhopal-then-I…
          <span className="handnote absolute -bottom-7 right-0 text-gold text-base whitespace-nowrap">
            breathe — slow down
          </span>
        </span>
      </p>

      <p className="text-[15px] leading-[2.1] text-ink-soft mt-6">
        …what I really care about is building things people{' '}
        <span className="relative font-medium text-ink">
          actually use.
          <span className="handnote absolute -bottom-7 right-0 text-leaf text-base whitespace-nowrap">
            strong close ✓
          </span>
        </span>
      </p>

      {/* The one thing */}
      <div className="mt-9 bg-brand-50 rounded-xl px-4 py-3.5 border-l-4 border-brand-600">
        <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-1">The one thing</p>
        <p className="text-sm text-ink leading-relaxed">
          Swap "basically" for a half-second pause. That's it. Next session, just that.
        </p>
      </div>

      {/* Taped corner effect */}
      <div className="absolute -top-3 left-10 w-16 h-6 bg-brand-100/70 rotate-[-4deg] rounded-sm" />
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative grain overflow-hidden bg-paper pt-16">
      <div className="absolute -top-32 -left-40 w-[520px] h-[520px] bg-brand-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -right-32 w-[380px] h-[380px] bg-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center py-24 lg:py-32">

          {/* Left — editorial text */}
          <div className="animate-fade-up">
            <p className="text-sm font-semibold text-brand-700 mb-6 flex items-center gap-2">
              <WaveMark className="w-6 h-4" animate />
              The only platform that truly listens to you.
            </p>

            <h1 className="font-display text-5xl lg:text-[3.9rem] font-semibold text-ink leading-[1.08] tracking-tight mb-7">
              You rehearse in your head.
              <br />
              The interview happens{' '}
              <CoachUnderline>out loud.</CoachUnderline>
            </h1>

            <p className="text-lg text-ink-soft leading-relaxed mb-10 max-w-md">
              Vocalize listens while you practice — interviews, presentations,
              speeches — and tells you the <em className="font-display not-italic font-semibold text-ink">one thing</em> to
              fix next time. Like a good coach would.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Link to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-ink text-paper font-semibold hover:bg-ink/85 transition-all hover:gap-3">
                Start speaking <ArrowRight size={17} />
              </Link>
              <a href="#how-it-works"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-ink/20 text-ink font-semibold hover:border-ink/50 transition-colors">
                How a session goes
              </a>
            </div>

            <p className="handnote text-xl text-ink-faint">
              No credit card. No judgement. Just you, out loud.
            </p>
          </div>

          {/* Right — the coach's markup */}
          <div className="relative flex justify-center lg:justify-end pt-8 lg:pt-0">
            <MarkedTranscript />
          </div>

        </div>
      </div>
    </section>
  )
}
