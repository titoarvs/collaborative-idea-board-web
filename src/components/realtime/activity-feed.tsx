import { useEffect, useRef, useState } from 'react'
import { Activity } from 'lucide-react'
import { userColor } from '@/lib/realtime/colors'
import type { ActivityEntry } from '@/lib/realtime/types'
import { cn } from '@/lib/utils'

interface Props {
  entries: ActivityEntry[]
  currentUserId?: string
  className?: string
}

function timeAgo(at: number) {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000))
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

/** Toggleable live activity log driven by realtime events. */
export function ActivityFeed({ entries, currentUserId, className }: Props) {
  const [open, setOpen] = useState(false)
  const [unseen, setUnseen] = useState(0)
  const ref = useRef<HTMLDivElement | null>(null)
  const lastSeen = useRef<string | null>(null)

  useEffect(() => {
    if (open) {
      setUnseen(0)
      lastSeen.current = entries[0]?.id ?? null
      return
    }
    const idx = entries.findIndex((e) => e.id === lastSeen.current)
    setUnseen(idx === -1 ? entries.length : idx)
  }, [entries, open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent',
          open && 'bg-accent',
        )}
      >
        <Activity className="h-4 w-4" />
        <span className="hidden sm:inline">Activity</span>
        {unseen > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unseen > 9 ? '9+' : unseen}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="border-b border-border px-4 py-2.5 text-sm font-semibold text-foreground">
            Activity
          </div>
          <div className="max-h-80 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No activity yet
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-start gap-2.5 px-4 py-2.5">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: userColor(e.userId) }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-foreground">
                        <span className="font-semibold">
                          {e.userId === currentUserId ? 'You' : e.name}
                        </span>{' '}
                        <span className="text-muted-foreground">{e.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {timeAgo(e.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
