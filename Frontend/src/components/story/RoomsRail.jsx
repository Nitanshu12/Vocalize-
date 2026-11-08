import { useLayoutEffect, useRef } from 'react'
import { Mic, Briefcase, Monitor, Users } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* Chapter four: the rooms, walked past one by one. On wide screens the page
 * turns sideways and each room slides in as you scroll; on phones and for
 * reduced motion they simply stack. */

const ROOMS = [
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

export default function RoomsRail() {
  const root = useRef(null)
  const track = useRef(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const distance = () => track.current.scrollWidth - window.innerWidth
        const slide = gsap.to(track.current, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        })
        // Each room leans in as it reaches the middle of the screen.
        gsap.utils.toArray('[data-room]').forEach((card) => {
          gsap.fromTo(
            card,
            { rotate: 4, scale: 0.9, y: 60 },
            {
              rotate: 0,
              scale: 1,
              y: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: card,
                containerAnimation: slide,
                start: 'left right',
                end: 'center 60%',
                scrub: true,
              },
            }
          )
        })
      }, root)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  return (
    <section id="modes" ref={root} className="relative bg-paper lg:h-[100svh] lg:overflow-hidden py-[var(--section-gap-s)] lg:py-0">
      <div
        ref={track}
        className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 lg:h-full lg:w-max px-[var(--gutter)] lg:pl-[max(var(--gutter),calc((100vw-var(--container))/2+var(--gutter)))] lg:pr-[20vw] will-change-transform"
      >
        <div className="lg:w-[38vw] lg:max-w-[560px] shrink-0 mb-8 lg:mb-0 lg:mr-[6vw]">
          <h2 className="display-section text-ink mb-6">Four rooms. One rule: you have to say it out loud.</h2>
          <p className="lead max-w-md">
            Reading interview answers on your phone is not practice. Each room puts you in a
            different speaking situation, and listens.
          </p>
        </div>

        {ROOMS.map(({ icon: Icon, title, description, note, tone }) => (
          <article
            key={title}
            data-room
            className={`shrink-0 rounded-card ${tone} p-7 sm:p-10 flex flex-col justify-between min-h-[22rem] lg:min-h-0 lg:h-[68svh] lg:w-[min(34vw,520px)]`}
          >
            <div className="flex items-start justify-between gap-4">
              <Icon size={34} strokeWidth={1.6} />
              {note && <span className="text-sm font-semibold opacity-75">{note}</span>}
            </div>
            <div>
              <h3 className="font-display font-bold tracking-[-0.045em] leading-[0.95] text-[clamp(2.5rem,3.6vw+0.5rem,4.5rem)] mb-5">
                {title}
              </h3>
              <p className="text-lg leading-relaxed opacity-80 max-w-[28rem]">{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
