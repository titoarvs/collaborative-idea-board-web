import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import type { Team } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface JoinTeamModalProps {
  onClose: () => void
  onTeamJoined: (team: Team) => void
}

export function JoinTeamModal({ onClose, onTeamJoined }: JoinTeamModalProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (code: string) =>
      api.post<Team>('/teams/join', { inviteCode: code }),
    onSuccess: (team) => {
      void qc.invalidateQueries({ queryKey: ['teams'] })
      onTeamJoined(team)
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Failed to join team')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setError('')
    mutation.mutate(inviteCode)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Join Team</h2>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Enter the 6-character invite code to join a team
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Invite Code
            </label>
            <Input
              placeholder="e.g., ABC123"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || inviteCode.length !== 6}
            >
              {mutation.isPending ? 'Joining...' : 'Join'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
