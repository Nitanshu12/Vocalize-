import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi, ttsApi } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  // 'loading' until the silent-refresh check below resolves, so routes can
  // avoid flashing a login screen before we know the cookie is still valid.
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    authApi
      .refresh()
      .then(async ({ accessToken }) => {
        const { user } = await authApi.me(accessToken)
        setAccessToken(accessToken)
        setUser(user)
        setStatus('authenticated')
      })
      .catch(() => setStatus('anonymous'))
  }, [])

  const login = useCallback(async (payload) => {
    const { user, accessToken } = await authApi.login(payload)
    setUser(user)
    setAccessToken(accessToken)
    setStatus('authenticated')
  }, [])

  const register = useCallback(async (payload) => {
    const { user, accessToken } = await authApi.register(payload)
    setUser(user)
    setAccessToken(accessToken)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {})
    setUser(null)
    setAccessToken(null)
    setStatus('anonymous')
  }, [])

  // Saves onboarding answers, then replaces the user in state with the returned
  // record — which now has onboarding_completed_at set, so RequireAuth lets the
  // user into /app instead of bouncing them back to /onboarding.
  const completeOnboarding = useCallback(
    async (answers) => {
      const { user } = await authApi.completeOnboarding(accessToken, answers)
      setUser(user)
    },
    [accessToken]
  )

  const fetchGreeting = useCallback(() => ttsApi.greeting(accessToken), [accessToken])

  return (
    <AuthContext.Provider
      value={{ user, accessToken, status, login, register, logout, completeOnboarding, fetchGreeting }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
