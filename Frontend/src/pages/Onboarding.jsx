import { WaveMark } from '../components/ui/Waveform'

// Placeholder — the real voice-greeting + profiling-questions flow lands here next.
export default function Onboarding() {
  return (
    <div className="min-h-screen bg-paper grain flex items-center justify-center">
      <div className="text-center">
        <WaveMark className="w-14 h-9 mx-auto mb-6" animate />
        <p className="handnote text-2xl text-ink-faint">onboarding coming soon…</p>
      </div>
    </div>
  )
}
