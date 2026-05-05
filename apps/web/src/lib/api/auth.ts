import { PUBLIC_API_URL } from '$env/static/public'

const API = PUBLIC_API_URL

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'buyer' | 'seller' | 'admin'
  avatar_url: string | null
  email_verified: boolean
}

export interface ApiError {
  error: string
  code: string
  details?: { field: string; message: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
  const json = await res.json()
  if (!res.ok) throw json as ApiError
  return json as T
}

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!res.ok) throw json as ApiError
  return json as T
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export function register(data: { name: string; email: string; password: string; phone?: string }) {
  return post<{ message: string; userId: string }>('/api/v1/auth/register', data)
}

export function login(data: { email: string; password: string }) {
  return post<{ accessToken: string; user: AuthUser }>('/api/v1/auth/login', data)
}

export function verifyEmail(data: { email: string; token: string }) {
  return post<{ message: string }>('/api/v1/auth/verify-email', data)
}

export function resendVerification(data: { email: string }) {
  return post<{ message: string }>('/api/v1/auth/resend-verification', data)
}

export function forgotPassword(data: { email: string }) {
  return post<{ message: string }>('/api/v1/auth/forgot-password', data)
}

export function resetPassword(data: { token: string; password: string }) {
  return post<{ message: string }>('/api/v1/auth/reset-password', data)
}

export function getMe(token: string) {
  return get<AuthUser>('/api/v1/auth/me', token)
}

export function refreshToken() {
  return fetch(`${API}/api/v1/auth/refresh`, { method: 'POST', credentials: 'include' }).then(
    async (res) => {
      const json = await res.json()
      if (!res.ok) throw json as ApiError
      return json as { accessToken: string }
    },
  )
}

export function logout(token: string) {
  return post<{ message: string }>('/api/v1/auth/logout', {}, token)
}
