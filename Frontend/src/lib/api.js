const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(data?.message ?? 'Something went wrong', res.status, data?.details)
  }

  return data
}

export const authApi = {
  register: (payload) => request('/api/v1/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/v1/auth/login', { method: 'POST', body: payload }),
  refresh: () => request('/api/v1/auth/refresh', { method: 'POST' }),
  logout: () => request('/api/v1/auth/logout', { method: 'POST' }),
  me: (token) => request('/api/v1/auth/me', { token }),
  completeOnboarding: (token, payload) =>
    request('/api/v1/auth/onboarding', { method: 'PATCH', body: payload, token }),
}

export const practiceApi = {
  paragraphs: (token) => request('/api/v1/practice/paragraphs', { token }),
  submitSession: (token, payload) =>
    request('/api/v1/practice/sessions', { method: 'POST', body: payload, token }),
  history: (token) => request('/api/v1/practice/sessions', { token }),
}

export const ttsApi = {
  // Returns a playable object URL for the greeting MP3. The response is binary
  // audio (not JSON), so it can't go through the shared `request` helper.
  async greeting(token) {
    const res = await fetch(`${API_URL}/api/v1/tts/greeting`, {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new ApiError(data?.message ?? 'Could not load greeting audio', res.status)
    }
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  },
}
