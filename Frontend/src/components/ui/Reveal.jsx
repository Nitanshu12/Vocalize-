import { motion } from 'motion/react'
import { EASE } from './motion'

/* Scroll-triggered reveal: rises 24px and fades in once, when a fifth of it is on screen.
 * MotionConfig reducedMotion="user" (App.jsx) drops the rise for people who ask for less motion. */
export default function Reveal({ children, className = '', delay = 0, as = 'div' }) {
  const Tag = motion[as] ?? motion.div
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE, delay: delay / 1000 }}
    >
      {children}
    </Tag>
  )
}
