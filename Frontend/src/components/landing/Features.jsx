import { WaveDivider } from '../ui/Waveform'
import Reveal from '../ui/Reveal'

const rows = [
  { flag: 'caught', color: 'text-coral', border: 'border-coral/30', text: '"basically" — 5 times in 90 seconds', sub: 'timestamps: 0:07, 0:23, 0:41, 1:02, 1:19' },
  { flag: 'noticed', color: 'text-gold', border: 'border-gold/30', text: 'You sped up to 190 wpm when talking about your weakness', sub: 'nervous pace — the answer was fine, the speed gave you away' },
  { flag: 'good', color: 'text-leaf', border: 'border-leaf/30', text: 'Your opening line answered the question directly', sub: 'most people take 30 seconds to get to the point. You took 4.' },
  { flag: 'caught', color: 'text-coral', border: 'border-coral/30', text: '"I think I would maybe try to…" — weak language on a strength question', sub: 'say "I would" — you were asked about something you\'re good at' },
  { flag: 'good', color: 'text-leaf', border: 'border-leaf/30', text: 'STAR structure: complete', sub: 'situation ✓ task ✓ action ✓ result ✓ — recruiters notice this' },
]

export default function Features() {
  return (
    <section id="why-it-works" className="relative grain py-24 bg-paper-dark">
      <div className="max-w-6xl mx-auto px-6">

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">

          {/* Left — text */}
          <Reveal>
            <p className="handnote text-2xl text-brand-700 mb-3">this is real feedback from a session</p>
            <h2 className="font-display text-4xl lg:text-5xl font-semibold text-ink tracking-tight mb-6">
              Feedback a friend
              <br />wouldn't dare give you
            </h2>
            <p className="text-lg text-ink-soft leading-relaxed mb-6">
              Your friends say "that was good, yaar." Your mirror says nothing.
              Vocalize tells you what an interviewer notices but never says out loud.
            </p>
            <p className="text-ink-soft leading-relaxed">
              Specific. Timestamped. Sometimes uncomfortable.
              Always one clear next step.
            </p>
          </Reveal>

          {/* Right — feedback rows styled as margin notes */}
          <Reveal className="space-y-3" delay={150}>
            {rows.map(({ flag, color, border, text, sub }) => (
              <div key={text}
                className={`bg-white rounded-xl border ${border} border-l-4 px-5 py-4`}>
                <div className="flex items-baseline gap-3">
                  <span className={`handnote text-lg ${color} shrink-0`}>{flag}</span>
                  <div>
                    <p className="text-[15px] text-ink font-medium leading-snug">{text}</p>
                    <p className="text-sm text-ink-faint mt-1">{sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </Reveal>

        </div>

        <WaveDivider className="mt-20" color="#cdd9d7" />
      </div>
    </section>
  )
}
