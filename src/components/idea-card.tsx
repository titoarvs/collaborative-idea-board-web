import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Idea } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ChevronRight, Trash2, ThumbsUp, GripVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RemoteHighlight {
  color: string
  name: string
}

interface IdeaCardProps {
  idea: Idea
  onOpen?: (idea: Idea) => void
  dragHandleProps?: Record<string, unknown>
  highlight?: RemoteHighlight | null
}

const statuses = ['backlog', 'in-progress', 'in-review', 'done']
const statusLabels: Record<string, string> = {
  backlog: 'To Do',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  done: 'Done',
}

export function IdeaCard({
  idea,
  onOpen,
  dragHandleProps,
  highlight,
}: IdeaCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const qc = useQueryClient()
  const currentIndex = statuses.indexOf(idea.status)

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['ideas'] })

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      await api.patch(`/ideas/${idea.id}/status`, { status: newStatus })
      await invalidate()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpvote = async () => {
    try {
      await api.post(`/ideas/${idea.id}/vote`)
      await invalidate()
    } catch (error) {
      console.error('Error upvoting:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/ideas/${idea.id}`)
      await invalidate()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  const createdLabel = new Date(idea.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      onClick={() => onOpen?.(idea)}
      className="group relative cursor-pointer rounded-lg border border-border bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      style={
        highlight
          ? { outline: `2px solid ${highlight.color}`, outlineOffset: '1px' }
          : undefined
      }
    >
      {highlight && (
        <span
          className="absolute -top-2 right-2 z-10 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
          style={{ backgroundColor: highlight.color }}
        >
          {highlight.name}
        </span>
      )}
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-2 text-sm font-semibold text-foreground">
            {idea.title}
          </h4>
          <div className="flex shrink-0 items-center">
            {dragHandleProps && (
              <button
                type="button"
                {...dragHandleProps}
                onClick={stop}
                className="flex h-6 w-6 cursor-grab items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 active:cursor-grabbing"
                aria-label="Drag idea"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                stop(e)
                void handleDelete()
              }}
              className="h-6 w-6 p-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              aria-label="Delete idea"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {idea.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {idea.description}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border pt-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {createdLabel}
            </span>
            <button
              type="button"
              onClick={(e) => {
                stop(e)
                void handleUpvote()
              }}
              className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ThumbsUp className="h-3 w-3" />
              {idea.votes}
            </button>
          </div>

          <div className="flex items-center gap-1" onClick={stop}>
            {currentIndex < statuses.length - 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStatusChange(statuses[currentIndex + 1])}
                disabled={isUpdating}
                className="h-7 w-7 p-0"
                aria-label="Move to next status"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button size="sm" variant="ghost" className="h-7 text-xs" />}
              >
                Move
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {statuses.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={status === idea.status || isUpdating}
                  >
                    {statusLabels[status]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SortableIdeaCard({
  idea,
  onOpen,
  highlight,
}: {
  idea: Idea
  onOpen: (idea: Idea) => void
  highlight?: RemoteHighlight | null
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: idea.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <IdeaCard
        idea={idea}
        onOpen={onOpen}
        dragHandleProps={{ ...attributes, ...listeners }}
        highlight={highlight}
      />
    </div>
  )
}
