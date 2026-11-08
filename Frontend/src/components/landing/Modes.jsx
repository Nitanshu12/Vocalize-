import { Mic, Briefcase, Monitor, Users } from 'lucide-react'
import { motion } from 'motion/react'
import Reveal from '../ui/Reveal'
import { staggerParent, staggerChild } from '../ui/motion'

const modes = [
  {
    icon: Briefcase,
    title: 'Interview room',
    description: 'Real HR and behavioural questions, asked one at a time. You answer out loud. We tell you if you actually answered.',
    note: 'The big one',
    tone: 'bg-accent text-accent-ink',
  },
  {
    icon: Mic,
    title: 'Free practice',
    description: 'No structure, no topic pressure. Talk about anything for two minutes and see what your speech actually sounds like.',
    note: 'Start here',
    tone: 'bg-accent-soft text-accent-ink',
  },
  {
    icon: Monitor,
    title: 'Presentation room',
    description: 'Rehearse slide by slide. Find out where you rush, where you ramble, and whether your transitions land.',
    note: '',
    tone: 'bg-paper-deep text-ink',
  },
  {
    icon: Users,
    title: 'The stage',
    description: 'Timed speeches on a topic you get 30 seconds to think about. Because real speaking rarely comes with prep time.',
    note: 'Hardest mode',
    tone: 'bg-olive text-ink',
  },
]

export default function Modes() {
  return (
    <section id="modes" className="py-[var(--section-gap-s)]">
      <div className="shell">
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 lg:gap-16 items-end mb-14 lg:mb-20">
          <Reveal>
            <h2 className="display-section text-ink">
              Four rooms. One rule: you have to say it out loud.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="lead max-w-md">
              Reading interview answers on your phone is not practice.
              Each room puts you in a different speaking situation, and listens.
            </p>
          </Reveal>
        </div>

        <motion.ul
          className="border-t border-rule"
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {modes.map(({ icon: Icon, title, description, note, tone }) => (
            <motion.li
              key={title}
              variants={staggerChild}
              className="group relative grid grid-cols-[56px_minmax(0,1fr)] md:grid-cols-[72px_minmax(0,1.1fr)_minmax(0,1fr)_120px] gap-x-6 gap-y-3 items-center py-8 md:py-10 border-b border-rule"
            >
              <span className={`w-14 h-14 md:w-[72px] md:h-[72px] rounded-card grid place-items-center transition-transform duration-500 ease-out group-hover:-rotate-3 group-hover:scale-105 ${tone}`}>
                <Icon size={24} strokeWidth={1.8} />
              </span>
              <h3 className="font-display text-3xl md:text-[2.6rem] font-bold tracking-[-0.035em] leading-none text-ink transition-transform duration-500 ease-out group-hover:translate-x-2">
                {title}
              </h3>
              <p className="col-start-2 md:col-start-auto text-ink-soft leading-relaxed max-w-md">{description}</p>
              <span className="col-start-2 md:col-start-auto md:justify-self-end text-sm text-accent font-medium">
                {note}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
