import { Check, Flame, Snowflake } from 'lucide-react'
import { motion } from 'motion/react'
import Reveal from '../ui/Reveal'

const EASE = [0.16, 1, 0.3, 1]
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const done = [true, true, true, false, true, true, false]
const FREEZE = 3

export default function Gamification() {
  return (
    <section id="habit" className="py-[var(--section-gap)]">
      <div className="shell grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-12 lg:gap-20 items-center">
        <Reveal>
          <h2 className="display-section text-ink mb-6">Showing up is the actual skill</h2>
          <p className="lead mb-5 max-w-md">
            Nobody becomes a confident speaker in one great session.
            It’s ten minutes a day, most days, for a couple of months.
          </p>
          <p className="text-ink-faint max-w-md">
            So we track your streak, protect it when life happens, and let your practice points
            pay for premium features. You can earn your way in without paying.
          </p>
        </Reveal>

        <div className="min-w-0">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-sm text-ink-faint mb-1">This week</p>
              <p className="font-display text-4xl lg:text-5xl font-bold tracking-[-0.04em] text-ink">5 of 7 days</p>
            </div>
            <p className="inline-flex items-center gap-2 text-gold font-semibold">
              <Flame size={18} /> 12-day streak
            </p>
          </div>

          <motion.ul
            className="grid grid-cols-7 gap-2"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            {days.map((d, i) => {
              const freeze = i === FREEZE
              const tone = done[i]
                ? 'bg-accent text-accent-ink'
                : freeze
                  ? 'bg-accent-soft text-accent-ink'
                  : 'border border-dashed border-rule text-ink-faint'
              return (
                <motion.li
                  key={i}
                  className={`aspect-[3/5] rounded-card flex flex-col items-center justify-between py-3 origin-bottom ${tone}`}
                  variants={{
                    hidden: { opacity: 0, scaleY: 0.3 },
                    show: { opacity: 1, scaleY: 1, transition: { duration: 0.7, ease: EASE } },
                  }}
                  aria-label={`${d}: ${done[i] ? 'practiced' : freeze ? 'streak freeze used' : 'not yet'}`}
                >
                  <span className="text-sm font-semibold">{d}</span>
                  {done[i] ? <Check size={18} strokeWidth={2.5} /> : freeze ? <Snowflake size={17} /> : null}
                </motion.li>
              )
            })}
          </motion.ul>

          <dl className="mt-8 border-t border-rule">
            <div className="flex justify-between gap-4 py-4 border-b border-rule">
              <dt className="text-ink-soft">Thursday, streak freeze used</dt>
              <dd className="text-ink">Life happens, streak safe</dd>
            </div>
            <div className="flex justify-between gap-4 py-4 border-b border-rule">
              <dt className="text-ink-soft">Practice points earned</dt>
              <dd className="font-semibold text-ink tabular-nums">340 pts</dd>
            </div>
            <div className="py-4">
              <div className="flex justify-between gap-4 mb-3">
                <dt className="text-ink-soft">500 pts gets you 24h of premium, on us</dt>
                <dd className="text-accent font-semibold tabular-nums">160 to go</dd>
              </div>
              <div className="h-2 rounded-sm bg-paper-deep overflow-hidden" aria-hidden="true">
                <motion.div
                  className="h-full bg-accent origin-left"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 340 / 500 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
                />
              </div>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
