import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { WaveMark } from '../ui/Waveform'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-paper/90 backdrop-blur-md border-b border-ink/10' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo — wordmark + waveform signature */}
        <a href="#" className="flex items-center gap-2.5">
          <WaveMark className="w-7 h-5" />
          <span className="font-display text-xl font-semibold text-ink tracking-tight">Vocalize</span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {['Modes', 'How it works', 'Why it works'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm font-medium text-ink-soft hover:text-ink transition-colors">
              {link}
            </a>
          ))}
        </div>

        {/* CTA + mobile toggle */}
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden md:block text-sm font-medium text-ink-soft hover:text-ink transition-colors">
            Log in
          </Link>
          <Link to="/register"
            className="hidden md:inline-flex items-center px-4 py-2 rounded-full bg-ink text-paper text-sm font-semibold hover:bg-ink/85 transition-colors">
            Start speaking
          </Link>

          <button
            type="button"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-paper/20 bg-paper text-ink shadow-sm md:hidden focus:outline-none focus:ring-2 focus:ring-ink/20"
            onClick={() => setMenuOpen(open => !open)}
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

      {menuOpen && (
        <div className="md:hidden bg-paper/95 border-t border-paper/80 shadow-sm backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 py-4 space-y-4">
            <div className="flex flex-col gap-3">
              {['Modes', 'How it works', 'Why it works'].map(link => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setMenuOpen(false)}
                  className="block text-base font-medium text-ink-soft hover:text-ink transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3 pt-2 border-t border-paper/80">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block text-base font-medium text-ink-soft hover:text-ink transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="inline-flex w-full justify-center items-center px-4 py-3 rounded-full bg-ink text-paper text-sm font-semibold hover:bg-ink/85 transition-colors"
              >
                Start speaking
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
