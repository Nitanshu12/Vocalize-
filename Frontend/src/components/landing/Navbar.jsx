import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { WaveMark } from '../ui/Waveform'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

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

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {['Modes', 'How it works', 'Why it works'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm font-medium text-ink-soft hover:text-ink transition-colors">
              {link}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden md:block text-sm font-medium text-ink-soft hover:text-ink transition-colors">
            Log in
          </Link>
          <Link to="/register"
            className="inline-flex items-center px-4 py-2 rounded-full bg-ink text-paper text-sm font-semibold hover:bg-ink/85 transition-colors">
            Start speaking
          </Link>
        </div>
      </div>
    </nav>
  )
}
