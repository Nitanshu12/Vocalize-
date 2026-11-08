import { motion } from 'motion/react'
import Reveal from '../ui/Reveal'
import { staggerParent, staggerChild } from '../ui/motion'

const rows = [
  { flag: 'Caught', color: 'text-coral', bar: 'bg-coral', text: '“basically”, 5 times in 90 seconds', sub: 'Timestamps 0:07, 0:23, 0:41, 1:02 and 1:19' },
  { flag: 'Noticed', color: 'text-gold', bar: 'bg-gold', text: 'You sped up to 190 wpm when talking about your weakness', sub: 'Nervous pace. The answer was fine, the speed gave you away.' },
  { flag: 'Good', color: 'text-leaf', bar: 'bg-leaf', text: 'Your opening line answered the question directly', sub: 'Most people take 30 seconds to get to the point. You took 4.' },
  { flag: 'Caught', color: 'text-coral', bar: 'bg-coral', text: '“I think I would maybe try to…”, weak language on a strength question', sub: 'Say “I would”. You were asked about something you’re good at.' },
  { flag: 'Good', color: 'text-leaf', bar: 'bg-leaf', text: 'STAR structure: complete', sub: 'Situation, task, action, result. Recruiters notice this.' },
]

export default function Features() {
  return (
    <section id="why-it-works" className="py-[var(--section-gap)] bg-paper-dark">
      <div className="shell grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-12 lg:gap-20 items-start">
        <Reveal className="lg:sticky lg:top-28">
          <h2 className="display-section text-ink mb-6">
            Feedback a friend wouldn’t dare give you
          </h2>
          <p className="lead mb-5 max-w-md">
            Your friends say “that was good, yaar.” Your mirror says nothing.
            Vocalize tells you what an interviewer notices but never says out loud.
          </p>
          <p className="text-ink-faint max-w-md">
            Specific. Timestamped. Sometimes uncomfortable. Always one clear next step.
          </p>
        </Reveal>

        <motion.ol
          className="border-t border-rule"
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {rows.map(({ flag, color, bar, text, sub }) => (
            <motion.li
              key={text}
              variants={staggerChild}
              className="relative grid grid-cols-[88px_minmax(0,1fr)] gap-5 py-6 border-b border-rule"
            >
              <span className={`text-sm font-semibold pt-1 flex items-center gap-2.5 ${color}`}>
                <span className={`w-[3px] h-4 rounded-sm ${bar}`} aria-hidden="true" />
                {flag}
              </span>
              <div>
                <p className="text-lg text-ink font-medium leading-snug">{text}</p>
                <p className="text-ink-faint mt-1.5">{sub}</p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}
