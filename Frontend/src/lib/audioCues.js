// Tiny Web-Audio "sound effects" for the interview UX — synthesized on the fly,
// so there are zero audio files to download and zero network cost.
//
// We keep a single shared AudioContext (browsers cap how many you can create)
// and resume it lazily: the first tone plays inside a user gesture chain
// (the "I'm ready" click), which unlocks audio for the rest of the session.

let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  const C = window.AudioContext || window.webkitAudioContext
  if (!C) return null
  if (!ctx || ctx.state === 'closed') ctx = new C()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

// One short shaped beep. We ramp the gain up and back down (an "envelope") so it
// sounds like a soft blip instead of a harsh click.
function blip(freq, duration, peak = 0.14, type = 'triangle') {
  const ac = getCtx()
  if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t = ac.currentTime
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

// A countdown tick — one per second on 3 · 2 · 1.
export function playTick() {
  blip(660, 0.14, 0.12, 'triangle')
}

// The final "go" — brighter and a touch longer, like a race-start beep.
export function playGo() {
  blip(920, 0.3, 0.16, 'sine')
}
