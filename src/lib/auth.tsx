import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AuthUser {
  id: string
  name: string
  email: string
  image: string | null
}

interface MeResponse {
  user: AuthUser | null
}

export function useAuth() {
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const res = await api.get<MeResponse>('/auth/me')
        return res.user
      } catch {
        return null
      }
    },
    staleTime: 30_000,
    retry: false,
  })

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isFetched: query.isFetched,
  }
}

export function useSignIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api.post<{ user: AuthUser }>('/auth/login', input),
    onSuccess: (data) => {
      qc.setQueryData(['auth', 'me'], data.user)
    },
  })
}

export function useSignUp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string }) =>
      api.post<{ user: AuthUser }>('/auth/register', input),
    onSuccess: (data) => {
      qc.setQueryData(['auth', 'me'], data.user)
    },
  })
}

export function useSignOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      qc.setQueryData(['auth', 'me'], null)
      qc.clear()
    },
  })
}
