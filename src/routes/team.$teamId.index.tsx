import { createFileRoute, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Team } from '@/lib/types'
import { useRequireAuth } from '@/lib/use-require-auth'
import { AppShell } from '@/components/app-shell'
import { TeamHeader } from '@/components/team-header'
import { KanbanBoard } from '@/components/kanban-board'

export const Route = createFileRoute('/team/$teamId/')({
  component: TeamBoardPage,
})

function TeamBoardPage() {
  const { teamId } = useParams({ from: '/team/$teamId/' })
  const id = Number(teamId)
  const { user } = useRequireAuth()

  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.get<Team[]>('/teams'),
    enabled: !!user,
  })
  const teamQuery = useQuery({
    queryKey: ['team', id],
    queryFn: () => api.get<Team>(`/teams/${id}`),
    enabled: !!user,
  })

  if (!user || !teamQuery.data) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  const team = teamQuery.data
  const teams = teamsQuery.data ?? []

  return (
    <AppShell user={user} teams={teams} activeTeamId={id}>
      <TeamHeader
        teamId={id}
        teamName={team.name}
        inviteCode={team.inviteCode}
        userName={user.name}
      />
      <div className="p-6 md:p-8">
        <KanbanBoard teamId={id} />
      </div>
    </AppShell>
  )
}
