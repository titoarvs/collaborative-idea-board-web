const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

type Json = Record<string, unknown> | unknown[] | null

interface RequestOptions {
  method?: string
  body?: Json
  // internal: prevents infinite refresh loops
  _retry?: boolean
}

let refreshPromise: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        // Allow subsequent refreshes after this one settles.
        setTimeout(() => {
          refreshPromise = null
        }, 0)
      })
  }
  return refreshPromise
}

async function parse(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, _retry } = options

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && !_retry && path !== '/auth/refresh') {
    const refreshed = await doRefresh()
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _retry: true })
    }
  }

  const data = await parse(res)

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? Array.isArray((data as { message: unknown }).message)
          ? ((data as { message: string[] }).message.join(', '))
          : String((data as { message: unknown }).message)
        : null) ?? res.statusText
    throw new ApiError(res.status, message)
  }

  return data as T
}

export const api = {
  get: <T = unknown>(path: string) => apiFetch<T>(path),
  post: <T = unknown>(path: string, body?: Json) =>
    apiFetch<T>(path, { method: 'POST', body }),
  patch: <T = unknown>(path: string, body?: Json) =>
    apiFetch<T>(path, { method: 'PATCH', body }),
  delete: <T = unknown>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),
}
