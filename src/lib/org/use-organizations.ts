import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Organization, OrgMember, OrgRole, Team } from '@/lib/types'

export const organizationsKey = ['organizations'] as const

/** Boards (teams) belonging to a specific organization. */
export function useOrgTeams(orgId: number | null) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['teams', orgId],
    queryFn: () => api.get<Team[]>(`/organizations/${orgId}/teams`),
    enabled: !!user && orgId !== null,
  })
}

export function useOrganizations() {
  const { user } = useAuth()
  return useQuery({
    queryKey: organizationsKey,
    queryFn: () => api.get<Organization[]>('/organizations'),
    enabled: !!user,
    staleTime: 10_000,
  })
}

export function useOrganization(orgId: number | null) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => api.get<Organization>(`/organizations/${orgId}`),
    enabled: !!user && orgId !== null,
  })
}

export function useCreateOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string }) =>
      api.post<Organization>('/organizations', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: organizationsKey })
    },
  })
}

export function useOrgMembers(orgId: number | null) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['organization', orgId, 'members'],
    queryFn: () => api.get<OrgMember[]>(`/organizations/${orgId}/members`),
    enabled: !!user && orgId !== null,
  })
}

export function useInviteOrgMember(orgId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { email: string; role: OrgRole }) =>
      api.post(`/organizations/${orgId}/invites`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['organization', orgId, 'members'] })
    },
  })
}

export function useUpdateOrgMemberRole(orgId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { userId: string; role: OrgRole }) =>
      api.patch(`/organizations/${orgId}/members/${input.userId}/role`, {
        role: input.role,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['organization', orgId, 'members'] })
    },
  })
}

export function useRemoveOrgMember(orgId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/organizations/${orgId}/members/${userId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['organization', orgId, 'members'] })
    },
  })
}
