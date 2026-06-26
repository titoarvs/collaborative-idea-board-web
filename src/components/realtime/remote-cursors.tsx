import { userColor } from '@/lib/realtime/colors'
import type { RemoteCursor } from '@/lib/realtime/types'

interface Props {
  cursors: Record<string, RemoteCursor>
  currentUserId?: string
  /**
   * Maps a cursor's stored coordinates to screen position (px) relative to the
   * board container. Return null to hide the cursor (e.g. off-screen).
   */
  project: (cursor: RemoteCursor) => { left: number; top: number } | null
}

/** Floating pointers + name labels for other users on the same board. */
export function RemoteCursors({ cursors, currentUserId, project }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {Object.values(cursors).map((c) => {
        if (c.userId === currentUserId) return null
        const pos = project(c)
        if (!pos) return null
        const color = userColor(c.userId)
        return (
          <div
            key={c.socketId}
            className="absolute left-0 top-0 transition-transform duration-75 ease-linear"
            style={{ transform: `translate(${pos.left}px, ${pos.top}px)` }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }}
            >
              <path
                d="M5.5 3.2l13 6.6-5.7 1.4-2.6 5.3z"
                fill={color}
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="ml-3 -mt-1 inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              {c.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
