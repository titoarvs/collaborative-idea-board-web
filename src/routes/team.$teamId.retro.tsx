import { createFileRoute, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Team } from '@/lib/types'
import type { CanvasElement, Member } from '@/lib/canvas/types'
import { useRequireAuth } from '@/lib/use-require-auth'
import { AppShell } from '@/components/app-shell'
import { TeamHeader } from '@/components/team-header'
import { RetroCanvas } from '@/components/canvas/retro-canvas'

export const Route = createFileRoute('/team/$teamId/retro')({
  component: TeamRetroPage,
})

function TeamRetroPage() {
  const { teamId } = useParams({ from: '/team/$teamId/retro' })
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
  const membersQuery = useQuery({
    queryKey: ['members', id],
    queryFn: () => api.get<Member[]>(`/teams/${id}/members`),
    enabled: !!user,
  })
  const elementsQuery = useQuery({
    queryKey: ['canvas', id],
    queryFn: async () => {
      await api.post(`/teams/${id}/canvas/seed`)
      return api.get<CanvasElement[]>(`/teams/${id}/canvas/elements`)
    },
    enabled: !!user,
  })

  if (!user || !teamQuery.data || !elementsQuery.data) {
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
      <div className="flex h-svh flex-col">
        <TeamHeader
          teamId={id}
          teamName={team.name}
          inviteCode={team.inviteCode}
          userName={user.name}
        />
        <div className="min-h-0 flex-1">
          <RetroCanvas
            teamId={id}
            initialElements={elementsQuery.data}
            members={membersQuery.data ?? []}
          />
        </div>
      </div>
    </AppShell>
  )
}
