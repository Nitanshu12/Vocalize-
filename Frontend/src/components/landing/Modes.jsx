import { Mic, Briefcase, Monitor, Users, ArrowRight } from 'lucide-react'
import { WaveDivider } from '../ui/Waveform'
import Reveal from '../ui/Reveal'

const modes = [
  {
    icon: Briefcase,
    title: 'Interview room',
    description: 'Real HR and behavioural questions, asked one at a time. You answer out loud. We tell you if you actually answered.',
    note: 'the big one',
    rotate: '-rotate-1',
  },
  {
    icon: Mic,
    title: 'Free practice',
    description: 'No structure, no topic pressure. Talk about anything for two minutes and see what your speech actually sounds like.',
    note: 'start here',
    rotate: 'rotate-[0.5deg]',
  },
  {
    icon: Monitor,
    title: 'Presentation room',
    description: 'Rehearse slide by slide. Find out where you rush, where you ramble, and whether your transitions land.',
    note: '',
    rotate: 'rotate-[1deg]',
  },
  {
    icon: Users,
    title: 'The stage',
    description: 'Timed speeches on a topic you get 30 seconds to think about. Because real speaking rarely comes with prep time.',
    note: 'hardest mode',
    rotate: '-rotate-[0.7deg]',
  },
]

export default function Modes() {
  return (
    <section id="modes" className="relative grain py-24 bg-paper-dark overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <Reveal className="max-w-2xl mb-16">
          <p className="handnote text-2xl text-brand-700 mb-3">pick a room →</p>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-ink tracking-tight mb-5">
            Four rooms. One rule:
            <br />you have to say it out loud.
          </h2>
          <p className="text-lg text-ink-soft leading-relaxed">
            Reading interview answers on your phone is not practice.
            Each room puts you in a different speaking situation — and listens.
          </p>
        </Reveal>

        {/* Mode cards — deliberately imperfect grid */}
        <Reveal className="grid md:grid-cols-2 gap-7" delay={120}>
          {modes.map(({ icon: Icon, title, description, note, rotate }) => (
            <div key={title}
              className={`group relative bg-white border border-ink/10 rounded-2xl p-8 ${rotate} hover:rotate-0 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(28,25,23,0.10)] cursor-pointer`}>

              {note && (
                <span className="handnote absolute -top-4 right-8 text-xl text-brand-700 rotate-[3deg]">
                  {note}
                </span>
              )}

              <div className="w-12 h-12 bg-paper-dark rounded-xl flex items-center justify-center mb-6 border border-ink/10">
                <Icon size={21} className="text-ink" />
              </div>

              <h3 className="font-display text-2xl font-semibold text-ink mb-3">{title}</h3>
              <p className="text-ink-soft leading-relaxed mb-6">{description}</p>

              <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 group-hover:gap-3 transition-all">
                Step in <ArrowRight size={15} />
              </div>
            </div>
          ))}
        </Reveal>

        <WaveDivider className="mt-20" color="#cdd9d7" />
      </div>
    </section>
  )
}
