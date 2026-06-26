export type Board = 'retro' | 'kanban'

export interface PresenceUser {
  userId: string
  name: string
  board: Board | null
}

export interface RemoteCursor {
  socketId: string
  userId: string
  name: string
  board: Board
  x: number
  y: number
  /** client-side timestamp of last update, used to expire stale cursors */
  at: number
}

export interface RemoteSelection {
  socketId: string
  userId: string
  name: string
  board: Board
  elementId: number | null
  editing: boolean
}

export interface ActivityEntry {
  id: string
  teamId: number
  userId: string
  name: string
  action: string
  board: Board | null
  at: number
}

/** Sync events forwarded to consumers so they can merge server state. */
export type BoardSyncEvent =
  | { type: 'element:created'; element: Record<string, unknown>; actorId: string }
  | { type: 'element:updated'; element: Record<string, unknown>; actorId: string }
  | { type: 'element:deleted'; id: number; actorId: string }
  | { type: 'idea:created'; idea: Record<string, unknown>; actorId: string }
  | { type: 'idea:updated'; idea: Record<string, unknown>; actorId: string }
  | { type: 'idea:deleted'; id: number; actorId: string }
  | {
      type: 'comment:created'
      comment: Record<string, unknown>
      ideaId: number
      actorId: string
    }
  | { type: 'comment:deleted'; id: number; ideaId: number; actorId: string }
