import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { WaveMark } from '../ui/Waveform'

const LINKS = ['Modes', 'How it works', 'Why it works']
const toId = (label) => `#${label.toLowerCase().replace(/\s+/g, '-')}`

export default function Navbar({ shown = true }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      className={`fixed top-0 inset-x-0 z-[300] border-b transition-colors duration-300 ${
        scrolled || menuOpen ? 'bg-paper border-rule' : 'bg-transparent border-transparent'
      }`}
      initial={false}
      animate={shown ? { y: 0, opacity: 1 } : { y: '-100%', opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      inert={shown ? undefined : true}
      aria-hidden={shown ? undefined : true}
    >
      <div className="shell h-[72px] flex items-center justify-between">
        <a href="#" className="flex items-center gap-3 rounded-control">
          <WaveMark className="w-8 h-6 text-accent" />
          <span className="font-display text-xl font-bold tracking-[-0.03em] text-ink">Vocalize</span>
        </a>

        <div className="hidden md:flex items-center gap-9">
          {LINKS.map((link) => (
            <a key={link} href={toId(link)} className="link-quiet text-[15px] font-medium rounded-sm">
              {link}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden md:inline-flex btn btn-sm btn-ghost border-transparent">
            Log in
          </Link>
          <Link to="/register" className="hidden md:inline-flex btn btn-sm btn-primary">
            Start speaking
          </Link>

          <button
            type="button"
            className="btn btn-sm btn-ghost w-11 px-0 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="sr-only">Toggle navigation</span>
            {menuOpen ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            className="md:hidden border-t border-rule bg-paper"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="shell py-5 space-y-5">
              <div className="flex flex-col gap-4">
                {LINKS.map((link) => (
                  <a
                    key={link}
                    href={toId(link)}
                    onClick={() => setMenuOpen(false)}
                    className="block text-lg font-medium text-ink"
                  >
                    {link}
                  </a>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-5 border-t border-rule">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-secondary">
                  Log in
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn btn-primary">
                  Start speaking
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
