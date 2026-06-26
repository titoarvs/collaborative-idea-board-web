import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth, isSystemAdmin, type AuthUser } from '@/lib/auth'

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

/**
 * Guard for platform-admin-only routes. Redirects unauthenticated visitors to
 * /sign-in and authenticated non-admins to /dashboard.
 */
export function useRequireSystemAdmin(): {
  user: AuthUser | null
  isLoading: boolean
  isAdmin: boolean
} {
  const { user, isLoading, isFetched } = useAuth()
  const navigate = useNavigate()
  const isAdmin = isSystemAdmin(user)

  useEffect(() => {
    if (!isFetched) return
    if (!user) {
      void navigate({ to: '/sign-in' })
    } else if (!isAdmin) {
      void navigate({ to: '/dashboard' })
    }
  }, [isFetched, user, isAdmin, navigate])

  return { user, isLoading, isAdmin }
}
