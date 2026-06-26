import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Team } from '@/lib/types'
import { useRequireAuth } from '@/lib/use-require-auth'
import { AppShell } from '@/components/app-shell'
import { DashboardContent } from '@/components/dashboard-content'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = useRequireAuth()
  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.get<Team[]>('/teams'),
    enabled: !!user,
  })

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
      <DashboardContent user={user} teams={teams} />
    </AppShell>
  )
}
