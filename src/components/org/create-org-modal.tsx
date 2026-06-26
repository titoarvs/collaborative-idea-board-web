import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api'
import { useCreateOrganization } from '@/lib/org/use-organizations'
import { useActiveOrg } from '@/lib/org/active-org'

export function CreateOrgModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const { setActiveOrgId } = useActiveOrg()
  const create = useCreateOrganization()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    create.mutate(
      { name: name.trim() },
      {
        onSuccess: (org) => {
          setActiveOrgId(org.id)
          onClose()
        },
        onError: (err) => {
          setError(
            err instanceof ApiError ? err.message : 'Failed to create organization',
          )
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">New organization</h2>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          An organization owns your boards, members, and subscription.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Organization name
            </label>
            <Input
              placeholder="e.g., Acme Inc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
