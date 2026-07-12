import { WaveMark } from '../ui/Waveform'
import Reveal from '../ui/Reveal'

const steps = [
  {
    n: '1',
    title: 'You talk.',
    description: 'Pick a room, get a question or a topic, and speak. Two minutes is enough. Your browser records it — nothing to install.',
  },
  {
    n: '2',
    title: 'We listen. Properly.',
    description: 'Every word transcribed, every pause measured, every "basically" caught with a timestamp. Then the AI reads your answer the way an interviewer would.',
  },
  {
    n: '3',
    title: 'You get one thing.',
    description: 'Not twelve metrics and a dashboard. One specific thing to fix in your next session. Fix it, and we’ll give you the next one.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative grain py-24 bg-paper">
      <div className="max-w-6xl mx-auto px-6">

        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-16 items-start">

          {/* Left — sticky heading */}
          <Reveal className="lg:sticky lg:top-28">
            <p className="handnote text-2xl text-brand-700 mb-3">a session takes ~3 minutes</p>
            <h2 className="font-display text-4xl lg:text-5xl font-semibold text-ink tracking-tight mb-6">
              Here's exactly what happens
            </h2>
            <p className="text-lg text-ink-soft leading-relaxed">
              We built this around one belief: feedback only works
              when it's specific, immediate, and small enough to act on.
            </p>
            <WaveMark className="w-12 h-8 mt-8" animate />
          </Reveal>

          {/* Right — steps as a list, not cards */}
          <Reveal className="space-y-2" delay={150}>
            {steps.map(({ n, title, description }, i) => (
              <div key={n}
                className={`flex gap-7 p-7 rounded-2xl ${i === 2 ? 'bg-white border border-ink/10 shadow-[0_2px_16px_rgba(28,25,23,0.06)]' : ''}`}>
                <span className="font-display text-6xl font-semibold text-brand-200 leading-none select-none">{n}</span>
                <div className="pt-1">
                  <h3 className="font-display text-2xl font-semibold text-ink mb-2">{title}</h3>
                  <p className="text-ink-soft leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </Reveal>

        </div>
      </div>
    </section>
  )
}
