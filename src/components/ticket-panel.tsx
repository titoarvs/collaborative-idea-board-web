import { useEffect } from 'react'
import { DiscussionThread } from './discussion-thread'
import { ThumbsUp, X, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PanelIdea {
  id: number
  title: string
  description?: string | null
  status: string
  votes: number
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  backlog: 'To Do',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  done: 'Done',
}
const STATUS_STYLE: Record<string, string> = {
  backlog: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  'in-review': 'bg-pink-100 text-pink-700',
  done: 'bg-green-100 text-green-700',
}

export function TicketPanel({
  idea,
  onClose,
}: {
  idea: PanelIdea | null
  onClose: () => void
}) {
  const open = idea !== null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-svh w-full max-w-md flex-col border-l border-border bg-card shadow-xl transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {idea && (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div className="min-w-0">
                <span
                  className={cn(
                    'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                    STATUS_STYLE[idea.status],
                  )}
                >
                  {STATUS_LABELS[idea.status] ?? idea.status}
                </span>
                <h2 className="mt-2 text-lg font-semibold text-foreground">
                  {idea.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 border-b border-border p-5">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(idea.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <ThumbsUp className="h-4 w-4" />
                  {idea.votes} votes
                </span>
              </div>
              {idea.description ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {idea.description}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  No description provided.
                </p>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Discussion
              </h3>
              <div className="min-h-0 flex-1">
                <DiscussionThread key={idea.id} ideaId={idea.id} />
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
