import { useState } from 'react'
import { api } from '@/lib/api'
import type { Idea } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'

interface NewIdeaFormProps {
  teamId: number
  onClose: () => void
  onIdeaCreated?: (idea: Idea) => void
}

export function NewIdeaForm({ teamId, onClose, onIdeaCreated }: NewIdeaFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    try {
      const idea = await api.post<Idea>(`/teams/${teamId}/ideas`, {
        title,
        description: description || undefined,
      })
      onIdeaCreated?.(idea)
      setTitle('')
      setDescription('')
      onClose()
    } catch (error) {
      console.error('Error creating idea:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-card border border-primary/30 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Create New Idea</h3>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Idea title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          placeholder="Description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="resize-none h-24"
        />

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !title.trim()}>
            {isLoading ? 'Creating...' : 'Create Idea'}
          </Button>
        </div>
      </form>
    </div>
  )
}
