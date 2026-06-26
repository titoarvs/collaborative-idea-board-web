import { createFileRoute } from '@tanstack/react-router'
import { Shield, Clock } from 'lucide-react'
import { useRequireSystemAdmin } from '@/lib/use-require-auth'
import { useActiveOrg } from '@/lib/org/active-org'
import { useOrgTeams } from '@/lib/org/use-organizations'
import {
  useAdminOrganizations,
  useSetOrgPlan,
  useExtendTrial,
} from '@/lib/admin/use-admin'
import type { Plan } from '@/lib/types'
import { AppShell } from '@/components/app-shell'
import { PlanBadge } from '@/components/billing/plan-badge'
import { PaymentSettingsCard } from '@/components/admin/payment-settings-card'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

function AdminPage() {
  const { user, isAdmin } = useRequireSystemAdmin()
  const { activeOrgId } = useActiveOrg()
  const teamsQuery = useOrgTeams(activeOrgId)
  const orgsQuery = useAdminOrganizations(isAdmin)
  const setPlan = useSetOrgPlan()
  const extendTrial = useExtendTrial()

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  const teams = teamsQuery.data ?? []
  const orgs = orgsQuery.data ?? []

  return (
    <AppShell user={user} teams={teams}>
      <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin console</h1>
            <p className="text-sm text-muted-foreground">
              Platform-wide organizations and subscriptions.
            </p>
          </div>
        </div>

        <PaymentSettingsCard enabled={isAdmin} />

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Organizations
          </h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Boards</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Trial ends</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orgsQuery.isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-muted-foreground">
                    Loading organizations...
                  </td>
                </tr>
              )}
              {!orgsQuery.isLoading && orgs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-muted-foreground">
                    No organizations found.
                  </td>
                </tr>
              )}
              {orgs.map((org) => (
                <tr key={org.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{org.name}</div>
                    {org.ownerEmail && (
                      <div className="text-xs text-muted-foreground">
                        {org.ownerEmail}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PlanBadge plan={org.plan} />
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {org.status}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {org.boardCount}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {org.memberCount}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {org.trialEndsAt
                      ? new Date(org.trialEndsAt).toLocaleDateString()
                      : '\u2014'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={org.plan}
                        disabled={setPlan.isPending}
                        onChange={(e) =>
                          setPlan.mutate({
                            orgId: org.id,
                            plan: e.target.value as Plan,
                          })
                        }
                        className="h-8 rounded-lg border border-border bg-background px-2 text-xs capitalize outline-none focus-visible:border-ring"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={extendTrial.isPending}
                        onClick={() =>
                          extendTrial.mutate({ orgId: org.id, days: 30 })
                        }
                        title="Extend trial by 30 days"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        +30d
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
