import { WaveMark } from '../ui/Waveform'

export default function Footer() {
  return (
    <footer className="bg-ink border-t border-paper/10 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <WaveMark className="w-7 h-5" color="#2ba3ab" />
              <span className="font-display text-xl font-semibold text-paper">Vocalize</span>
            </div>
            <p className="text-sm text-paper/40 max-w-xs leading-relaxed">
              Speech practice that listens. Interviews, presentations,
              public speaking — free, out loud, every day.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-12 text-sm">
            <div>
              <p className="text-paper font-semibold mb-3">Product</p>
              <ul className="space-y-2.5">
                {['The rooms', 'How it works', 'Practice points', 'Pricing'].map(l => (
                  <li key={l}><a href="#" className="text-paper/40 hover:text-paper transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-paper font-semibold mb-3">Company</p>
              <ul className="space-y-2.5">
                {['About', 'Blog', 'Privacy', 'Terms'].map(l => (
                  <li key={l}><a href="#" className="text-paper/40 hover:text-paper transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-paper/10 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-paper/30">
          <p>© 2026 Vocalize. All rights reserved.</p>
          <p className="handnote text-base">made by someone who also said "basically" too much</p>
        </div>
      </div>
    </footer>
  )
}
