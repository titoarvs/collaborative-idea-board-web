import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Mail, Trash2, UserPlus } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { useRequireAuth } from '@/lib/use-require-auth'
import { useActiveOrg } from '@/lib/org/active-org'
import {
  useOrgTeams,
  useOrgMembers,
  useInviteOrgMember,
  useUpdateOrgMemberRole,
  useRemoveOrgMember,
} from '@/lib/org/use-organizations'
import type { OrgRole } from '@/lib/types'
import { AppShell } from '@/components/app-shell'
import { PlanBadge } from '@/components/billing/plan-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/settings/organization')({
  component: OrgSettingsPage,
})

const ROLES: OrgRole[] = ['owner', 'admin', 'member']

function initials(value: string) {
  const parts = value.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function OrgSettingsPage() {
  const { user } = useRequireAuth()
  const { activeOrg, activeOrgId } = useActiveOrg()
  const teamsQuery = useOrgTeams(activeOrgId)
  const membersQuery = useOrgMembers(activeOrgId)
  const invite = useInviteOrgMember(activeOrgId)
  const updateRole = useUpdateOrgMemberRole(activeOrgId)
  const removeMember = useRemoveOrgMember(activeOrgId)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrgRole>('member')
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  const teams = teamsQuery.data ?? []
  const members = membersQuery.data ?? []
  const canManage = activeOrg?.role === 'owner' || activeOrg?.role === 'admin'

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    invite.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => setEmail(''),
        onError: (err) =>
          setError(err instanceof ApiError ? err.message : 'Failed to invite'),
      },
    )
  }

  return (
    <AppShell user={user} teams={teams}>
      <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              {activeOrg?.name ?? 'Organization'}
            </h1>
            {activeOrg && <PlanBadge plan={activeOrg.plan} />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who can access this organization and its boards.
          </p>
        </div>

        {canManage && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Invite a teammate
            </h2>
            <form
              onSubmit={handleInvite}
              className="mt-3 flex flex-wrap items-end gap-3"
            >
              <div className="min-w-56 flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="teammate@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as OrgRole)}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm capitalize outline-none focus-visible:border-ring"
                >
                  {ROLES.filter((r) => r !== 'owner').map((r) => (
                    <option key={r} value={r} className="capitalize">
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={invite.isPending || !email.trim()}>
                <UserPlus className="h-4 w-4" />
                {invite.isPending ? 'Inviting...' : 'Invite'}
              </Button>
            </form>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            {invite.isSuccess && !error && (
              <p className="mt-2 text-sm text-primary">Invitation sent.</p>
            )}
          </section>
        )}

        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Members ({members.length})
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {members.length === 0 && (
              <li className="px-5 py-4 text-sm text-muted-foreground">
                No members yet.
              </li>
            )}
            {members.map((m) => (
              <li
                key={m.userId}
                className="flex items-center gap-3 px-5 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {initials(m.name || m.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {m.name || m.email}
                    {m.userId === user.id && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email}
                  </p>
                </div>
                {canManage && m.role !== 'owner' && m.userId !== user.id ? (
                  <select
                    value={m.role}
                    disabled={updateRole.isPending}
                    onChange={(e) =>
                      updateRole.mutate({
                        userId: m.userId,
                        role: e.target.value as OrgRole,
                      })
                    }
                    className="h-8 rounded-lg border border-border bg-background px-2 text-xs capitalize outline-none focus-visible:border-ring"
                  >
                    {ROLES.filter((r) => r !== 'owner').map((r) => (
                      <option key={r} value={r} className="capitalize">
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                    {m.role}
                  </span>
                )}
                {canManage && m.role !== 'owner' && m.userId !== user.id && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={removeMember.isPending}
                    onClick={() => removeMember.mutate(m.userId)}
                    title="Remove member"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  )
}
