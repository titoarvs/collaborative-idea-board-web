import type { ReactNode } from 'react'
import { AppSidebar } from './app-sidebar'

interface AppShellProps {
  user: { id: string; name: string; email: string }
  teams: { id: number; name: string }[]
  activeTeamId?: number
  children: ReactNode
}

export function AppShell({ user, teams, activeTeamId, children }: AppShellProps) {
  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar user={user} teams={teams} activeTeamId={activeTeamId} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
