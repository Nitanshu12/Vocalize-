import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { WaveMark } from '../ui/Waveform'

export default function RequireAuth({ children, requireOnboarding = true }) {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <WaveMark className="w-10 h-7" animate />
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  if (requireOnboarding && !user?.onboarding_completed_at) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
