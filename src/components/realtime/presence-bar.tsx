import { initials } from '@/lib/canvas/types'
import { userColor } from '@/lib/realtime/colors'
import type { PresenceUser } from '@/lib/realtime/types'
import { cn } from '@/lib/utils'

interface Props {
  users: PresenceUser[]
  currentUserId?: string
  max?: number
  className?: string
}

/** Live avatars of everyone currently connected to the board. */
export function PresenceBar({ users, currentUserId, max = 6, className }: Props) {
  if (users.length === 0) return null

  const ordered = [...users].sort((a, b) => {
    if (a.userId === currentUserId) return -1
    if (b.userId === currentUserId) return 1
    return a.name.localeCompare(b.name)
  })
  const shown = ordered.slice(0, max)
  const overflow = ordered.length - shown.length

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {shown.map((u) => (
        <span
          key={u.userId}
          title={u.userId === currentUserId ? `${u.name} (you)` : u.name}
          className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold text-white shadow-sm"
          style={{ backgroundColor: userColor(u.userId) }}
        >
          {initials(u.name || 'User')}
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
        </span>
      ))}
      {overflow > 0 && (
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  )
}
