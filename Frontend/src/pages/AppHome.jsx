import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
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
        Pick a script, speak it out loud, and get scored — your coach is ready.
      </p>
      <Link
        to="/app/practice"
        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-ink text-paper font-semibold text-lg hover:gap-3.5 transition-all mb-4"
      >
        Start a practice session <ArrowRight size={19} />
      </Link>
      <button
        onClick={logout}
        className="inline-flex items-center px-6 py-3 rounded-full border border-ink/20 text-ink font-semibold hover:border-ink/50 transition-colors"
      >
        Log out
      </button>
    </div>
  )
}
