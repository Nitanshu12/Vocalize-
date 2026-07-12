import { Link } from 'react-router-dom'
import { WaveMark } from '../ui/Waveform'

export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-paper">

      {/* Left — brand storytelling, hidden on mobile */}
      <div className="hidden lg:flex relative grain flex-col justify-between bg-ink overflow-hidden p-12">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-20 w-[320px] h-[320px] bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        <Link to="/" className="relative flex items-center gap-2.5">
          <WaveMark className="w-7 h-5" color="#a78bfa" />
          <span className="font-display text-xl font-semibold text-paper tracking-tight">Vocalize</span>
        </Link>

        <div className="relative">
          <WaveMark className="w-12 h-8 mb-8" color="#a78bfa" animate />
          <h2 className="font-display text-4xl font-semibold text-paper leading-[1.15] tracking-tight mb-5 max-w-sm">
            You rehearse in your head. The interview happens out loud.
          </h2>
          <p className="handnote text-xl text-paper/50">
            No credit card. No judgement. Just you, out loud.
          </p>
        </div>

        <p className="relative text-sm text-paper/40">© {new Date().getFullYear()} Vocalize</p>
      </div>

      {/* Right — the form */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16">
        <div className="lg:hidden flex items-center gap-2.5 mb-12">
          <WaveMark className="w-7 h-5" />
          <span className="font-display text-xl font-semibold text-ink tracking-tight">Vocalize</span>
        </div>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          {eyebrow && (
            <p className="text-sm font-semibold text-brand-700 mb-3 flex items-center gap-2">
              <WaveMark className="w-5 h-3.5" />
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-3xl font-semibold text-ink tracking-tight mb-2">{title}</h1>
          {subtitle && <p className="text-ink-soft mb-9">{subtitle}</p>}

          {children}
        </div>
      </div>
    </div>
  )
}
