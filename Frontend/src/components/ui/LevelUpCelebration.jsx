import { useEffect, useRef } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

/* LevelUpCelebration — the game-style "unlock" moment.
 *
 * Shown once, full-screen, when a practice session pushes the user into a new
 * level. Three ingredients, all dependency-free:
 *   1. A pop/chime — synthesized with the Web Audio API (no asset file). It only
 *      plays after the user's "Finish" click, so the browser autoplay policy is
 *      satisfied. Skipped if the user prefers reduced motion.
 *   2. Confetti — a tiny hand-rolled canvas particle burst (teal/gold/coral/leaf,
 *      our semantic palette). Also skipped under prefers-reduced-motion.
 *   3. The card — the new level ring, number, and title, popping in with a bounce.
 *
 * Props: level = { level, title } (the NEW level), previousLevel (number|null),
 * onClose ().
 */

// Confetti colours come from the tokens, read when the burst starts.
const CONFETTI_TOKENS = ['--color-accent', '--color-accent-2', '--color-warn', '--color-success', '--color-ink']

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

// Three-note rising arpeggio (C5–E5–G5) with a soft attack/decay envelope —
// reads as a bright "unlock" ding without needing an audio file.
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const t = now + i * 0.11
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.4)
    })
    // Free the context once the sound has finished.
    setTimeout(() => ctx.close().catch(() => {}), 900)
  } catch {
    // Audio is a nice-to-have; never let it break the celebration.
  }
}

export default function LevelUpCelebration({ level, previousLevel, onClose }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    playChime()

    const canvas = canvasRef.current
    if (!canvas) return
    const css = getComputedStyle(document.documentElement)
    const CONFETTI_COLORS = CONFETTI_TOKENS.map((t) => css.getPropertyValue(t).trim())
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const W = (canvas.width = window.innerWidth * dpr)
    const H = (canvas.height = window.innerHeight * dpr)
    ctx.scale(dpr, dpr)
    const w = window.innerWidth

    // Burst from the top-centre, arcing down under gravity.
    const particles = Array.from({ length: 140 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 120,
      y: window.innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * -11 - 4,
      size: Math.random() * 7 + 4,
      color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 1,
    }))

    let raf
    let frame = 0
    const tick = () => {
      frame++
      ctx.clearRect(0, 0, W, H)
      let alive = false
      for (const p of particles) {
        p.vy += 0.28 // gravity
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        if (frame > 45) p.life -= 0.02
        if (p.life > 0 && p.y < window.innerHeight + 30) {
          alive = true
          ctx.save()
          ctx.globalAlpha = Math.max(0, p.life)
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
          ctx.restore()
        }
      }
      if (alive) raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Level up — you reached level ${level.level}, ${level.title}`}
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-paper/90 animate-[luFade_.3s_ease-out]"
        onClick={onClose}
      />
      {/* confetti canvas sits above the backdrop, below the card */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />

      <div className="relative w-full max-w-sm rounded-card bg-surface border border-rule px-8 py-10 text-center animate-[luPop_.5s_cubic-bezier(.34,1.56,.64,1)]">
        <p className="text-accent font-semibold mb-1">Level unlocked</p>

        {/* level ring */}
        <div className="relative mx-auto my-5 w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" className="stroke-rule" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              className="stroke-accent"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="276"
              strokeDashoffset="276"
              style={{ animation: 'luRing .9s .2s ease-out forwards' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-ink-faint">
              Level
            </span>
            <span className="font-display text-4xl font-semibold text-ink leading-none">
              {level.level}
            </span>
          </div>
        </div>

        <h2 className="font-display text-3xl font-semibold text-ink tracking-tight mb-1">
          {level.title}
        </h2>
        <p className="text-sm text-ink-soft mb-1">
          {previousLevel ? `You've moved up from Level ${previousLevel}.` : 'A new level unlocked.'}
        </p>
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 mb-7">
          <Sparkles size={15} /> Keep the streak alive
        </p>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-primary btn-lg w-full"
          autoFocus
        >
          Continue <ArrowRight size={18} className="btn-arrow" />
        </button>
      </div>

      <style>{`
        @keyframes luFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes luPop {
          0% { opacity: 0; transform: scale(.8) translateY(20px) }
          100% { opacity: 1; transform: scale(1) translateY(0) }
        }
        @keyframes luRing { to { stroke-dashoffset: 0 } }
        @media (prefers-reduced-motion: reduce) { .lu-anim { animation: none !important } }
      `}</style>
    </div>
  )
}
