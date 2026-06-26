import { createFileRoute, useParams, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, MessagesSquare } from 'lucide-react'
import { api } from '@/lib/api'
import type { Team } from '@/lib/types'
import type { CanvasElement, Member } from '@/lib/canvas/types'
import { useRequireAuth } from '@/lib/use-require-auth'
import { useActiveOrg } from '@/lib/org/active-org'
import { useOrgTeams } from '@/lib/org/use-organizations'
import { useEntitlements } from '@/lib/billing/entitlements'
import { AppShell } from '@/components/app-shell'
import { TeamHeader } from '@/components/team-header'
import { RetroCanvas } from '@/components/canvas/retro-canvas'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/team/$teamId/retro')({
  component: TeamRetroPage,
})

function TeamRetroPage() {
  const { teamId } = useParams({ from: '/team/$teamId/retro' })
  const id = Number(teamId)
  const { user } = useRequireAuth()
  const { getOrgById } = useActiveOrg()

  const teamQuery = useQuery({
    queryKey: ['team', id],
    queryFn: () => api.get<Team>(`/teams/${id}`),
    enabled: !!user,
  })
  const org = getOrgById(teamQuery.data?.organizationId)
  const ent = useEntitlements(org)
  const teamsQuery = useOrgTeams(teamQuery.data?.organizationId ?? null)

  const membersQuery = useQuery({
    queryKey: ['members', id],
    queryFn: () => api.get<Member[]>(`/teams/${id}/members`),
    enabled: !!user && ent.retroEnabled,
  })
  const elementsQuery = useQuery({
    queryKey: ['canvas', id],
    queryFn: async () => {
      await api.post(`/teams/${id}/canvas/seed`)
      return api.get<CanvasElement[]>(`/teams/${id}/canvas/elements`)
    },
    enabled: !!user && ent.retroEnabled,
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

  if (!ent.retroEnabled) {
    return (
      <AppShell user={user} teams={teams} activeTeamId={id}>
        <div className="flex h-svh flex-col">
          <TeamHeader
            teamId={id}
            teamName={team.name}
            inviteCode={team.inviteCode}
            userName={user.name}
            org={org}
          />
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-md space-y-5 rounded-xl border border-border bg-card p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessagesSquare className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Retro is a Pro feature
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upgrade your organization to Pro to run retrospectives on a
                  collaborative whiteboard.
                </p>
              </div>
              <Link to="/billing">
                <Button>
                  <Sparkles className="h-4 w-4" />
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!elementsQuery.data) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <AppShell user={user} teams={teams} activeTeamId={id}>
      <div className="flex h-svh flex-col">
        <TeamHeader
          teamId={id}
          teamName={team.name}
          inviteCode={team.inviteCode}
          userName={user.name}
          org={org}
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
