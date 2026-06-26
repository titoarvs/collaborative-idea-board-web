import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Plan, SubscriptionStatus } from '@/lib/types'

export interface AdminOrganization {
  id: number
  name: string
  plan: Plan
  status: SubscriptionStatus
  trialEndsAt: string | null
  boardCount: number
  memberCount: number
  ownerEmail: string | null
  createdAt: string
}

const adminOrgsKey = ['admin', 'organizations'] as const

export function useAdminOrganizations(enabled: boolean) {
  return useQuery({
    queryKey: adminOrgsKey,
    queryFn: () => api.get<AdminOrganization[]>('/admin/organizations'),
    enabled,
  })
}

export function useSetOrgPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { orgId: number; plan: Plan }) =>
      api.patch(`/admin/organizations/${input.orgId}/plan`, {
        plan: input.plan,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminOrgsKey })
      void qc.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
}

export function useExtendTrial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { orgId: number; days: number }) =>
      api.patch(`/admin/organizations/${input.orgId}/trial`, {
        days: input.days,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminOrgsKey })
      void qc.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
}

// --- billing provider settings --------------------------------------------

export type BillingProvider = 'dev' | 'stripe' | 'paymongo' | 'none'

export interface BillingSettings {
  activeProvider: BillingProvider
  encryptionConfigured: boolean
  stripe: {
    pricePro: string | null
    secretKeySet: boolean
    webhookSecretSet: boolean
  }
  paymongo: {
    proAmount: number | null
    secretKeySet: boolean
    webhookSecretSet: boolean
  }
  updatedAt: string | null
  updatedBy: string | null
}

/** Fields sent on save. Secret fields are omitted unless re-entered. */
export interface UpdateBillingSettings {
  activeProvider?: BillingProvider
  stripeSecretKey?: string
  stripePricePro?: string
  stripeWebhookSecret?: string
  paymongoSecretKey?: string
  paymongoProAmount?: number
  paymongoWebhookSecret?: string
}

const billingSettingsKey = ['admin', 'billing-settings'] as const

export function useBillingSettings(enabled: boolean) {
  return useQuery({
    queryKey: billingSettingsKey,
    queryFn: () => api.get<BillingSettings>('/admin/billing-settings'),
    enabled,
  })
}

export function useUpdateBillingSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateBillingSettings) =>
      api.put<BillingSettings>(
        '/admin/billing-settings',
        input as Record<string, unknown>,
      ),
    onSuccess: (data) => {
      qc.setQueryData(billingSettingsKey, data)
    },
  })
}
