import { WaveMark } from '../ui/Waveform'

const COLUMNS = [
  { title: 'Product', links: ['The rooms', 'How it works', 'Practice points', 'Pricing'] },
  { title: 'Company', links: ['About', 'Blog', 'Privacy', 'Terms'] },
]

export default function Footer() {
  return (
    <footer className="border-t border-rule pt-16 pb-10">
      <div className="shell">
        <div className="grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-12">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <WaveMark className="w-9 h-7 text-accent" />
              <span className="font-display text-3xl font-bold tracking-[-0.04em] text-ink">Vocalize</span>
            </div>
            <p className="text-ink-soft max-w-xs leading-relaxed">
              Speech practice that listens. Interviews, presentations, public speaking.
              Free, out loud, every day.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12">
            {COLUMNS.map(({ title, links }) => (
              <div key={title}>
                <p className="text-ink font-semibold mb-4">{title}</p>
                <ul className="space-y-3">
                  {links.map((l) => (
                    <li key={l}>
                      <a href="#" className="link-quiet rounded-sm">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-rule mt-14 pt-6 flex flex-col md:flex-row justify-between gap-3 text-sm text-ink-faint">
          <p>© 2026 Vocalize. All rights reserved.</p>
          <p>Made by someone who also said “basically” too much.</p>
        </div>
      </div>
    </footer>
  )
}
