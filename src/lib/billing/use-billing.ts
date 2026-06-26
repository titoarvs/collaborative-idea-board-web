import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Plan, Subscription } from '@/lib/types'

export function useSubscription(orgId: number | null) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['organization', orgId, 'subscription'],
    queryFn: () =>
      api.get<Subscription>(`/organizations/${orgId}/subscription`),
    enabled: !!user && orgId !== null,
  })
}

interface CheckoutResponse {
  url: string
}

/**
 * Provider-agnostic checkout. The backend (PayMongo or Stripe) creates a hosted
 * session and returns its URL; we just redirect the browser to it.
 */
export function useCheckout() {
  return useMutation({
    mutationFn: (input: { organizationId: number; plan: Plan }) =>
      api.post<CheckoutResponse>('/billing/checkout', input),
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url
    },
  })
}

/** Opens the provider's customer portal for managing/cancelling a subscription. */
export function useBillingPortal() {
  return useMutation({
    mutationFn: (input: { organizationId: number }) =>
      api.post<CheckoutResponse>('/billing/portal', input),
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url
    },
  })
}
