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
}
