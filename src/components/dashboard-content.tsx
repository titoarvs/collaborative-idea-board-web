import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TeamCard } from './team-card'
import { CreateTeamModal } from './create-team-modal'
import { JoinTeamModal } from './join-team-modal'
import { Plus, UserPlus, Search } from 'lucide-react'
import type { Team } from '@/lib/types'

interface DashboardContentProps {
  user: { id: string; name: string; email: string }
  teams: Team[]
}

export function DashboardContent({ user, teams }: DashboardContentProps) {
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showJoinTeam, setShowJoinTeam] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-6 md:px-8">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search boards..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-56 pl-9"
              />
            </div>
            <Button onClick={() => setShowCreateTeam(true)}>
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your Boards</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back, {user.name}
            </p>
          </div>
          <Button onClick={() => setShowJoinTeam(true)} variant="outline">
            <UserPlus className="h-4 w-4" />
            Join Team
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <p className="mb-4 text-muted-foreground">No boards yet</p>
            <Button onClick={() => setShowCreateTeam(true)}>
              Create your first board
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </div>

      {showCreateTeam && (
        <CreateTeamModal
          onClose={() => setShowCreateTeam(false)}
          onTeamCreated={() => setShowCreateTeam(false)}
        />
      )}
      {showJoinTeam && (
        <JoinTeamModal
          onClose={() => setShowJoinTeam(false)}
          onTeamJoined={() => setShowJoinTeam(false)}
        />
      )}
    </div>
  )
}
