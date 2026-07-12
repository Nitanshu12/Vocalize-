import { Flame, Snowflake } from 'lucide-react'
import Reveal from '../ui/Reveal'

const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const done = [true, true, true, false, true, true, false]

export default function Gamification() {
  return (
    <section className="relative grain py-24 bg-paper">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — the philosophy */}
          <Reveal>
            <p className="handnote text-2xl text-brand-700 mb-3">the unsexy truth</p>
            <h2 className="font-display text-4xl lg:text-5xl font-semibold text-ink tracking-tight mb-6">
              Showing up is
              <br />the actual skill
            </h2>
            <p className="text-lg text-ink-soft leading-relaxed mb-5">
              Nobody becomes a confident speaker in one great session.
              It's ten minutes a day, most days, for a couple of months.
            </p>
            <p className="text-ink-soft leading-relaxed">
              So we track your streak, protect it when life happens,
              and let your practice points unlock premium features —
              you can earn your way in without paying.
            </p>
          </Reveal>

          {/* Right — a week, drawn like a habit journal */}
          <Reveal className="bg-white rounded-2xl border border-ink/10 p-8 rotate-[-0.8deg] shadow-[0_2px_24px_rgba(28,25,23,0.07)]" delay={150}>

            <div className="flex items-center justify-between mb-7">
              <div>
                <p className="text-xs text-ink-faint font-medium uppercase tracking-wider mb-1">This week</p>
                <p className="font-display text-2xl font-semibold text-ink">5 of 7 days</p>
              </div>
              <div className="flex items-center gap-2 bg-paper-dark rounded-full px-4 py-2 border border-ink/10">
                <Flame size={17} className="text-gold" />
                <span className="font-semibold text-ink text-sm">12-day streak</span>
              </div>
            </div>

            {/* Week dots */}
            <div className="flex justify-between mb-8">
              {days.map((d, i) => (
                <div key={i} className="text-center">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-2 border-2 ${
                    done[i]
                      ? 'bg-brand-600 border-brand-600'
                      : i === 3
                        ? 'bg-white border-ink/15'
                        : 'bg-white border-dashed border-ink/20'
                  }`}>
                    {done[i]
                      ? <span className="text-white text-sm font-bold">✓</span>
                      : i === 3
                        ? <Snowflake size={15} className="text-sky-400" />
                        : <span className="text-ink-faint text-xs">·</span>}
                  </div>
                  <span className="text-xs text-ink-faint font-medium">{d}</span>
                </div>
              ))}
            </div>

            {/* Annotations */}
            <div className="space-y-3 border-t border-dashed border-ink/10 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink-soft">Thursday — streak freeze used</span>
                <span className="handnote text-lg text-sky-500">life happens, streak safe ✓</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink-soft">Practice points earned</span>
                <span className="font-semibold text-ink text-sm">340 pts</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink-soft">500 pts → 24h of premium, on us</span>
                <span className="handnote text-lg text-brand-700">160 to go</span>
              </div>
            </div>

          </Reveal>
        </div>
      </div>
    </section>
  )
}
