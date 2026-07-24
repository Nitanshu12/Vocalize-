// The waveform is Vocalize's signature mark — used as logo, divider, and loader.
const LOGO_BARS = [8, 14, 20, 12, 16, 7]

export function WaveMark({ className = '', color = '#0e7c86', animate = false }) {
  return (
    <svg viewBox="0 0 34 24" className={className} fill="none" aria-hidden="true">
      {LOGO_BARS.map((h, i) => (
        <rect
          key={i}
          className={animate ? 'wavebar' : ''}
          style={animate ? { animationDelay: `${i * 0.12}s` } : {}}
          x={i * 5.5 + 1}
          y={12 - h / 2}
          width="3"
          height={h}
          rx="1.5"
          fill={color}
        />
      ))}
    </svg>
  )
}

const DIVIDER_BARS = [5, 9, 14, 8, 18, 11, 22, 15, 9, 13, 6, 17, 10, 20, 7, 12, 16, 8, 14, 5]

export function WaveDivider({ color = '#a7d8d4', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-1.5 py-2 ${className}`} aria-hidden="true">
      {DIVIDER_BARS.map((h, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{ width: 3, height: h, background: color }}
        />
      ))}
    </div>
  )
}
