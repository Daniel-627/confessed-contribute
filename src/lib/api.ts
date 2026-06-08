// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL

export async function apiFetch<T>(path: string, token: string | null, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `${res.status}`)
  }
  return res.json()
}
