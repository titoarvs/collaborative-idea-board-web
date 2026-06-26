import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users, Copy, Check } from 'lucide-react'
import type { Team } from '@/lib/types'

export function TeamCard({ team }: { team: Team }) {
  const [copied, setCopied] = useState(false)

  const copyInviteCode = async () => {
    const inviteLink = `${window.location.origin}/join/${team.inviteCode}`
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link
        to="/team/$teamId"
        params={{ teamId: String(team.id) }}
        className="block"
      >
        <div className="h-20 bg-linear-to-br from-primary to-blue-400" />
      </Link>
      <div className="space-y-4 p-5">
        <div>
          <Link to="/team/$teamId" params={{ teamId: String(team.id) }}>
            <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary">
              {team.name}
            </h3>
          </Link>
          {team.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {team.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>
            {team.activeSessions}/{team.maxSessions} active sessions
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            to="/team/$teamId"
            params={{ teamId: String(team.id) }}
            className="flex-1"
          >
            <Button className="w-full">
              Open <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={copyInviteCode}
            title="Copy invite link"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        {copied && <p className="text-xs text-primary">Invite link copied!</p>}
      </div>
    </div>
  )
}
