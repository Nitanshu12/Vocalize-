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
  history: (token) => request('/api/v1/practice/sessions', { token }),
  stats: (token) => request('/api/v1/practice/stats', { token }),
  // Short-lived token for the browser's AssemblyAI streaming websocket.
  streamingToken: (token) => request('/api/v1/practice/streaming-token', { token }),
  // Transcript + word timestamps come from the client's streaming STT — plain JSON.
  submitSession: (token, payload) =>
    request('/api/v1/practice/sessions', { method: 'POST', body: payload, token }),
}

export const interviewApi = {
  // Browser-safe catalogue of interview types (powers setup + brief screens).
  types: (token) => request('/api/v1/interview/types', { token }),
  // Recent interviews for the dashboard activity feed.
  history: (token) => request('/api/v1/interview/sessions', { token }),
  // Begin a session -> { threadId, question } (the opening line).
  start: (token, payload) =>
    request('/api/v1/interview/start', { method: 'POST', body: payload, token }),
  // Submit one answer -> { done:false, question } OR { done:true, report }.
  answer: (token, payload) =>
    request('/api/v1/interview/answer', { method: 'POST', body: payload, token }),
}

export const profileApi = {
  // { track, profile } — profile is null until the user builds one.
  get: (token) => request('/api/v1/profile', { token }),
  // Which audience the user belongs to; decides which rounds they're offered.
  setTrack: (token, track) =>
    request('/api/v1/profile/track', { method: 'PUT', body: { track }, token }),
  // The no-resume path: four plain-language answers -> the same profile shape.
  guided: (token, answers) =>
    request('/api/v1/profile/guided', { method: 'POST', body: answers, token }),
  remove: (token) => request('/api/v1/profile', { method: 'DELETE', token }),

  // Resume upload can't use the shared `request` helper: that helper sets a
  // JSON content-type, whereas a multipart upload needs the browser to generate
  // its own content-type WITH the boundary. Setting it by hand breaks the parse.
  async uploadResume(token, file) {
    const form = new FormData()
    form.append('resume', file)
    const res = await fetch(`${API_URL}/api/v1/profile/resume`, {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw new ApiError(data?.message ?? 'Could not read that resume', res.status)
    }
    return data
  },
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
  // Speaks an arbitrary line (the interviewer's question). Returns an object URL.
  async speak(token, text) {
    const res = await fetch(`${API_URL}/api/v1/tts/speak`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new ApiError(data?.message ?? 'Could not load audio', res.status)
    }
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  },
}
