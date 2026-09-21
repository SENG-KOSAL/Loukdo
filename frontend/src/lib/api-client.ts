export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message ?? error.error ?? "API request failed")
  }
  return res.json()
}
