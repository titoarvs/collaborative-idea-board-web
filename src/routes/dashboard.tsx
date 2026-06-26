import { createFileRoute } from '@tanstack/react-router'
import { useRequireAuth } from '@/lib/use-require-auth'
import { useActiveOrg } from '@/lib/org/active-org'
import { useOrgTeams } from '@/lib/org/use-organizations'
import { AppShell } from '@/components/app-shell'
import { DashboardContent } from '@/components/dashboard-content'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = useRequireAuth()
  const { activeOrg, activeOrgId } = useActiveOrg()
  const teamsQuery = useOrgTeams(activeOrgId)

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  const teams = teamsQuery.data ?? []

  return (
    <AppShell user={user} teams={teams}>
      <DashboardContent user={user} teams={teams} org={activeOrg} />
    </AppShell>
  )
}
