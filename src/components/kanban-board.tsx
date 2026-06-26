import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Idea } from '@/lib/types'
import { SortableIdeaCard, IdeaCard } from './idea-card'
import { NewIdeaForm } from './new-idea-form'
import { TicketPanel } from './ticket-panel'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, Table2, List } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUSES = ['backlog', 'in-progress', 'in-review', 'done']
const STATUS_LABELS: Record<string, string> = {
  backlog: 'To Do',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  done: 'Done',
}
const STATUS_DOT: Record<string, string> = {
  backlog: 'bg-blue-500',
  'in-progress': 'bg-amber-500',
  'in-review': 'bg-pink-500',
  done: 'bg-green-500',
}

function Column({
  status,
  ideas,
  onNew,
  onOpen,
}: {
  status: string
  ideas: Idea[]
  onNew: () => void
  onOpen: (idea: Idea) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl bg-muted/70 p-3 transition-colors',
        isOver && 'bg-accent/60 ring-2 ring-primary/30',
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_DOT[status])} />
          <h3 className="text-sm font-semibold text-foreground">
            {STATUS_LABELS[status]}
          </h3>
          <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {ideas.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          aria-label="Add idea"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2.5">
        <SortableContext
          items={ideas.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {ideas.map((idea) => (
            <SortableIdeaCard key={idea.id} idea={idea} onOpen={onOpen} />
          ))}
        </SortableContext>
        {ideas.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Drop ideas here
          </p>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({ teamId }: { teamId: number }) {
  const qc = useQueryClient()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [showNewForm, setShowNewForm] = useState(false)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const suppressUntil = useRef(0)

  const { data } = useQuery({
    queryKey: ['ideas', teamId],
    queryFn: () => api.get<Idea[]>(`/teams/${teamId}/ideas`),
    refetchInterval: 3500,
  })

  // Sync server data into local state, but not while dragging or right after a
  // local mutation (so optimistic state isn't clobbered).
  useEffect(() => {
    if (!data) return
    if (activeId !== null || Date.now() < suppressUntil.current) return
    setIdeas(data)
  }, [data, activeId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const columns = useMemo(() => {
    const map: Record<string, Idea[]> = {}
    for (const status of STATUSES) {
      map[status] = ideas
        .filter((i) => i.status === status)
        .sort((a, b) => a.position - b.position || a.id - b.id)
    }
    return map
  }, [ideas])

  const findStatus = useCallback(
    (id: number | string): string | undefined => {
      if (typeof id === 'string' && STATUSES.includes(id)) return id
      return ideas.find((i) => i.id === id)?.status
    },
    [ideas],
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id))
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return
    const activeIdNum = Number(active.id)
    const fromStatus = findStatus(active.id)
    const toStatus = findStatus(over.id)
    if (!fromStatus || !toStatus || fromStatus === toStatus) return

    setIdeas((prev) => {
      const moving = prev.find((i) => i.id === activeIdNum)
      if (!moving) return prev
      return prev.map((i) =>
        i.id === activeIdNum ? { ...i, status: toStatus } : i,
      )
    })
  }

  const persistColumns = async (next: Idea[], affected: Set<string>) => {
    const calls: Promise<unknown>[] = []
    for (const status of affected) {
      const colItems = next
        .filter((i) => i.status === status)
        .sort((a, b) => a.position - b.position || a.id - b.id)
      colItems.forEach((item, index) => {
        calls.push(
          api.patch(`/ideas/${item.id}/move`, { status, position: index }),
        )
      })
    }
    try {
      await Promise.all(calls)
    } catch {
      // Best-effort; polling will reconcile.
    } finally {
      void qc.invalidateQueries({ queryKey: ['ideas', teamId] })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeIdNum = Number(active.id)
    const fromStatus = ideas.find((i) => i.id === activeIdNum)?.status
    const toStatus = findStatus(over.id)
    if (!fromStatus || !toStatus) return

    setIdeas((prev) => {
      const current = [...prev]
      const colItems = current
        .filter((i) => i.status === toStatus)
        .sort((a, b) => a.position - b.position || a.id - b.id)

      const oldIndex = colItems.findIndex((i) => i.id === activeIdNum)
      let newIndex = colItems.findIndex((i) => i.id === Number(over.id))
      if (newIndex === -1) newIndex = colItems.length - 1

      const reordered =
        oldIndex === -1 ? colItems : arrayMove(colItems, oldIndex, newIndex)

      const positionByItem = new Map<number, number>()
      reordered.forEach((item, index) => positionByItem.set(item.id, index))

      const next = current.map((i) =>
        positionByItem.has(i.id)
          ? { ...i, status: toStatus, position: positionByItem.get(i.id)! }
          : i,
      )

      const affected = new Set<string>([toStatus])
      if (fromStatus !== toStatus) {
        affected.add(fromStatus)
        const srcItems = next
          .filter((i) => i.status === fromStatus)
          .sort((a, b) => a.position - b.position || a.id - b.id)
        srcItems.forEach((item, index) => {
          const target = next.find((n) => n.id === item.id)
          if (target) target.position = index
        })
      }

      suppressUntil.current = Date.now() + 2000
      void persistColumns(next, affected)
      return next
    })
  }

  const activeIdea = ideas.find((i) => i.id === activeId) ?? null
  const selectedIdea = ideas.find((i) => i.id === selectedId) ?? null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <span className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">
            <LayoutGrid className="h-3.5 w-3.5" />
            Kanban
          </span>
          <span className="flex cursor-default items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground">
            <Table2 className="h-3.5 w-3.5" />
            Table
          </span>
          <span className="flex cursor-default items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground">
            <List className="h-3.5 w-3.5" />
            List
          </span>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)}>
          <Plus className="h-4 w-4" />
          New Idea
        </Button>
      </div>

      {showNewForm && (
        <NewIdeaForm
          teamId={teamId}
          onClose={() => setShowNewForm(false)}
          onIdeaCreated={(idea) => {
            setIdeas((prev) => [...prev, idea])
            void qc.invalidateQueries({ queryKey: ['ideas', teamId] })
            setShowNewForm(false)
          }}
        />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              ideas={columns[status]}
              onNew={() => setShowNewForm(true)}
              onOpen={(idea) => setSelectedId(idea.id)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeIdea ? (
            <div className="rotate-2">
              <IdeaCard idea={activeIdea} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TicketPanel idea={selectedIdea} onClose={() => setSelectedId(null)} />
    </div>
  )
}
