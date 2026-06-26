import { useCallback, useEffect, useRef, useState } from 'react'
import { getSocket } from './socket'
import type {
  ActivityEntry,
  Board,
  BoardSyncEvent,
  PresenceUser,
  RemoteCursor,
  RemoteSelection,
} from './types'

interface Options {
  teamId: number
  board: Board
  name: string
  enabled?: boolean
  onSync?: (event: BoardSyncEvent) => void
}

const CURSOR_THROTTLE_MS = 45
const CURSOR_TTL_MS = 5000
const ACTIVITY_LIMIT = 50

export function useBoardRealtime({
  teamId,
  board,
  name,
  enabled = true,
  onSync,
}: Options) {
  const [presence, setPresence] = useState<PresenceUser[]>([])
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({})
  const [selections, setSelections] = useState<Record<string, RemoteSelection>>(
    {},
  )
  const [activity, setActivity] = useState<ActivityEntry[]>([])

  const onSyncRef = useRef(onSync)
  onSyncRef.current = onSync
  const lastCursorSent = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const socket = getSocket()
    const join = () => socket.emit('board:join', { teamId, board, name })

    const onPresence = (data: { users: PresenceUser[] }) =>
      setPresence(data.users ?? [])

    const onCursor = (c: Omit<RemoteCursor, 'at'>) => {
      if (c.board !== board) return
      setCursors((prev) => ({ ...prev, [c.socketId]: { ...c, at: Date.now() } }))
    }

    const onPresenceLeft = (data: { socketId: string; userId: string }) => {
      setCursors((prev) => {
        const next = { ...prev }
        delete next[data.socketId]
        return next
      })
      setSelections((prev) => {
        const next = { ...prev }
        delete next[data.socketId]
        return next
      })
    }

    const onSelect = (s: RemoteSelection) => {
      if (s.board !== board) return
      setSelections((prev) => {
        const next = { ...prev }
        if (s.elementId == null) delete next[s.socketId]
        else next[s.socketId] = s
        return next
      })
    }

    const onActivity = (entry: ActivityEntry) =>
      setActivity((prev) => [entry, ...prev].slice(0, ACTIVITY_LIMIT))

    const forward = (event: BoardSyncEvent) => onSyncRef.current?.(event)
    const onElementCreated = (p: { element: Record<string, unknown>; actorId: string }) =>
      forward({ type: 'element:created', ...p })
    const onElementUpdated = (p: { element: Record<string, unknown>; actorId: string }) =>
      forward({ type: 'element:updated', ...p })
    const onElementDeleted = (p: { id: number; actorId: string }) =>
      forward({ type: 'element:deleted', ...p })
    const onIdeaCreated = (p: { idea: Record<string, unknown>; actorId: string }) =>
      forward({ type: 'idea:created', ...p })
    const onIdeaUpdated = (p: { idea: Record<string, unknown>; actorId: string }) =>
      forward({ type: 'idea:updated', ...p })
    const onIdeaDeleted = (p: { id: number; actorId: string }) =>
      forward({ type: 'idea:deleted', ...p })
    const onCommentCreated = (p: {
      comment: Record<string, unknown>
      ideaId: number
      actorId: string
    }) => forward({ type: 'comment:created', ...p })
    const onCommentDeleted = (p: { id: number; ideaId: number; actorId: string }) =>
      forward({ type: 'comment:deleted', ...p })

    socket.on('connect', join)
    socket.on('presence:state', onPresence)
    socket.on('cursor:move', onCursor)
    socket.on('presence:left', onPresenceLeft)
    socket.on('element:select', onSelect)
    socket.on('activity:new', onActivity)
    socket.on('element:created', onElementCreated)
    socket.on('element:updated', onElementUpdated)
    socket.on('element:deleted', onElementDeleted)
    socket.on('idea:created', onIdeaCreated)
    socket.on('idea:updated', onIdeaUpdated)
    socket.on('idea:deleted', onIdeaDeleted)
    socket.on('comment:created', onCommentCreated)
    socket.on('comment:deleted', onCommentDeleted)

    if (socket.connected) join()
    else socket.connect()

    // Expire cursors that stopped updating (e.g. user went idle / tab hidden).
    const sweep = setInterval(() => {
      const cutoff = Date.now() - CURSOR_TTL_MS
      setCursors((prev) => {
        let changed = false
        const next: Record<string, RemoteCursor> = {}
        for (const [id, c] of Object.entries(prev)) {
          if (c.at >= cutoff) next[id] = c
          else changed = true
        }
        return changed ? next : prev
      })
    }, 2000)

    return () => {
      clearInterval(sweep)
      socket.off('connect', join)
      socket.off('presence:state', onPresence)
      socket.off('cursor:move', onCursor)
      socket.off('presence:left', onPresenceLeft)
      socket.off('element:select', onSelect)
      socket.off('activity:new', onActivity)
      socket.off('element:created', onElementCreated)
      socket.off('element:updated', onElementUpdated)
      socket.off('element:deleted', onElementDeleted)
      socket.off('idea:created', onIdeaCreated)
      socket.off('idea:updated', onIdeaUpdated)
      socket.off('idea:deleted', onIdeaDeleted)
      socket.off('comment:created', onCommentCreated)
      socket.off('comment:deleted', onCommentDeleted)
      socket.disconnect()
      setPresence([])
      setCursors({})
      setSelections({})
    }
  }, [teamId, board, name, enabled])

  const sendCursor = useCallback(
    (x: number, y: number) => {
      const now = Date.now()
      if (now - lastCursorSent.current < CURSOR_THROTTLE_MS) return
      lastCursorSent.current = now
      getSocket().emit('cursor:move', { teamId, board, x, y })
    },
    [teamId, board],
  )

  const sendSelection = useCallback(
    (elementId: number | null, editing = false) => {
      getSocket().emit('element:select', { teamId, board, elementId, editing })
    },
    [teamId, board],
  )

  return { presence, cursors, selections, activity, sendCursor, sendSelection }
}
