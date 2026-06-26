import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { api, ApiError } from '@/lib/api'
import type { Team } from '@/lib/types'
import { useRequireAuth } from '@/lib/use-require-auth'
import { Layers } from 'lucide-react'

export const Route = createFileRoute('/join/$inviteCode')({
  component: JoinPage,
})

function JoinPage() {
  const { inviteCode } = useParams({ from: '/join/$inviteCode' })
  const { user } = useRequireAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const attempted = useRef(false)

  useEffect(() => {
    if (!user || attempted.current) return
    attempted.current = true
    api
      .post<Team>('/teams/join', { inviteCode })
      .then((team) => {
        void navigate({ to: '/team/$teamId', params: { teamId: String(team.id) } })
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to join team')
      })
  }, [user, inviteCode, navigate])

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Layers className="h-5 w-5" />
        </div>
        {error ? (
          <>
            <h1 className="text-lg font-semibold text-foreground">
              Couldn&apos;t join
            </h1>
            <p className="text-sm text-destructive">{error}</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-foreground">
              Joining team...
            </h1>
            <p className="text-sm text-muted-foreground">
              Hang tight while we add you with code{' '}
              <span className="font-mono font-medium">{inviteCode}</span>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
