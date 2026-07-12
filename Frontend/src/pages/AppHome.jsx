import { WaveMark } from '../components/ui/Waveform'
import { useAuth } from '../context/AuthContext'

export default function AppHome() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-paper grain flex flex-col items-center justify-center px-6 text-center">
      <WaveMark className="w-12 h-8 mb-8" animate />
      <h1 className="font-display text-3xl font-semibold text-ink tracking-tight mb-2">
        Welcome, {user?.name || user?.email}.
      </h1>
      <p className="text-ink-soft mb-9 max-w-sm">
        You're logged in. Practice sessions, transcripts, and feedback land here next.
      </p>
      <button
        onClick={logout}
        className="inline-flex items-center px-6 py-3 rounded-full border border-ink/20 text-ink font-semibold hover:border-ink/50 transition-colors"
      >
        Log out
      </button>
    </div>
  )
}
