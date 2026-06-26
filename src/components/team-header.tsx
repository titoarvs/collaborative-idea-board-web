import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Copy, Check, LayoutGrid, MessagesSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamHeaderProps {
  teamId: number
  teamName: string
  inviteCode: string
  userName: string
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function TeamHeader({
  teamId,
  teamName,
  inviteCode,
  userName,
}: TeamHeaderProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [copied, setCopied] = useState(false)
  const isRetro = pathname.endsWith('/retro')

  const copyInviteLink = async () => {
    const inviteLink = `${window.location.origin}/join/${inviteCode}`
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabClass = (active: boolean) =>
    cn(
      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
      active
        ? 'bg-accent text-accent-foreground'
        : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-6 md:px-8">
        <div className="flex items-center gap-4">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
            {teamName}
          </h1>
          <nav className="hidden items-center gap-1 rounded-lg border border-border bg-background p-1 sm:flex">
            <Link
              to="/team/$teamId"
              params={{ teamId: String(teamId) }}
              className={tabClass(!isRetro)}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </Link>
            <Link
              to="/team/$teamId/retro"
              params={{ teamId: String(teamId) }}
              className={tabClass(isRetro)}
            >
              <MessagesSquare className="h-3.5 w-3.5" />
              Retro
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-2 ring-card">
            {initials(userName)}
          </span>
          {inviteCode && (
            <Button variant="outline" size="sm" onClick={copyInviteLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Share'}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
