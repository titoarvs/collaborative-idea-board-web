import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth, type AuthUser } from '@/lib/auth'

/**
 * Client-side route guard. Redirects to /sign-in once we know the visitor is
 * unauthenticated. Returns the current user (or null while loading).
 */
export function useRequireAuth(): { user: AuthUser | null; isLoading: boolean } {
  const { user, isLoading, isFetched } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isFetched && !user) {
      void navigate({ to: '/sign-in' })
    }
  }, [isFetched, user, navigate])

  return { user, isLoading }
}
