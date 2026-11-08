// Shared motion settings: one easing curve and one stagger rhythm for the whole site.
export const EASE = [0.16, 1, 0.3, 1]

export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}

export const staggerChild = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}
