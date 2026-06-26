import { Link, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from './logout-button'

interface SidebarTeam {
  id: number
  name: string
}

interface AppSidebarProps {
  user: { id: string; name: string; email: string }
  teams: SidebarTeam[]
  activeTeamId?: number
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function AppSidebar({ user, teams, activeTeamId }: AppSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const dashboardActive = pathname === '/dashboard'

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Layers className="h-4 w-4" />
        </div>
        <span className="text-base font-semibold tracking-tight text-foreground">
          IdeaBoard
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        <Link
          to="/dashboard"
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
            dashboardActive
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground/70 hover:bg-muted hover:text-foreground',
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        <p className="px-2 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Your Boards
        </p>
        <div className="flex flex-col gap-0.5">
          {teams.length === 0 && (
            <p className="px-2.5 py-2 text-sm text-muted-foreground">
              No boards yet
            </p>
          )}
          {teams.map((team) => {
            const active = team.id === activeTeamId
            return (
              <Link
                key={team.id}
                to="/team/$teamId"
                params={{ teamId: String(team.id) }}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {initials(team.name)}
                </span>
                <span className="truncate">{team.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials(user.name || user.email)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="mt-2">
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
