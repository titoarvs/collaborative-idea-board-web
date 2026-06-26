import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import {
  type CanvasElement as CanvasEl,
  type Member,
  type Tool,
  type ShapeKind,
  type Viewport,
  colorBorder,
  clampZoom,
} from '@/lib/canvas/types'
import { useBoardRealtime } from '@/lib/realtime/use-board-realtime'
import type { BoardSyncEvent, PresenceUser } from '@/lib/realtime/types'
import { userColor } from '@/lib/realtime/colors'
import { PresenceBar } from '@/components/realtime/presence-bar'
import { RemoteCursors } from '@/components/realtime/remote-cursors'
import { ActivityFeed } from '@/components/realtime/activity-feed'
import { CanvasElement, type ResizeHandle } from './canvas-element'
import { CanvasToolbar } from './canvas-toolbar'
import { ElementToolbar } from './element-toolbar'
import { ZoomControls } from './zoom-controls'
import { cn } from '@/lib/utils'

interface Props {
  teamId: number
  initialElements: CanvasEl[]
  members: Member[]
}

type Drag =
  | { mode: 'pan'; sx: number; sy: number; panX0: number; panY0: number }
  | {
      mode: 'move'
      id: number
      sx: number
      sy: number
      x0: number
      y0: number
      zoom: number
      moved: boolean
    }
  | {
      mode: 'resize'
      id: number
      handle: ResizeHandle
      sx: number
      sy: number
      x0: number
      y0: number
      w0: number
      h0: number
      zoom: number
    }
  | null

const DEFAULTS: Record<string, { w: number; h: number }> = {
  sticky: { w: 192, h: 150 },
  text: { w: 200, h: 60 },
  frame: { w: 380, h: 320 },
  shape: { w: 170, h: 130 },
  stamp: { w: 48, h: 48 },
}

const listElements = (teamId: number) =>
  api.get<CanvasEl[]>(`/teams/${teamId}/canvas/elements`)
const createElement = (teamId: number, payload: Record<string, unknown>) =>
  api.post<CanvasEl>(`/teams/${teamId}/canvas/elements`, payload)
const updateElement = (id: number, patch: Record<string, unknown>) =>
  api.patch<CanvasEl>(`/canvas/elements/${id}`, patch)
const voteElement = (id: number) => api.post(`/canvas/elements/${id}/vote`)
const deleteElement = (id: number) => api.delete(`/canvas/elements/${id}`)

export function RetroCanvas({ teamId, initialElements, members }: Props) {
  const { user } = useAuth()
  const currentUserId = user?.id

  const [elements, setElements] = useState<CanvasEl[]>(initialElements)
  const [vp, setVp] = useState<Viewport>({ panX: 0, panY: 0, zoom: 1 })
  const [tool, setTool] = useState<Tool>('select')
  const [shape, setShape] = useState<ShapeKind>('rect')
  const [stamp, setStamp] = useState<string>('heart')
  const [color, setColor] = useState<string>('yellow')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [linePreview, setLinePreview] = useState<{
    x: number
    y: number
    x2: number
    y2: number
  } | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<Drag>(null)
  const lineStartRef = useRef<{ x: number; y: number } | null>(null)
  const suppressRef = useRef(0)
  const vpRef = useRef(vp)
  vpRef.current = vp

  useEffect(() => {
    setElements(initialElements)
  }, [initialElements])

  // --- viewport persistence --------------------------------------------------
  useEffect(() => {
    const raw = localStorage.getItem(`retro-vp-${teamId}`)
    if (raw) {
      try {
        setVp(JSON.parse(raw))
      } catch {
        /* ignore */
      }
    }
  }, [teamId])

  useEffect(() => {
    localStorage.setItem(`retro-vp-${teamId}`, JSON.stringify(vp))
  }, [vp, teamId])

  // --- polling ---------------------------------------------------------------
  const refresh = useCallback(async () => {
    if (Date.now() < suppressRef.current) return
    if (dragRef.current || editingId !== null) return
    try {
      const fresh = await listElements(teamId)
      setElements(fresh)
    } catch {
      /* ignore */
    }
  }, [teamId, editingId])

  // Realtime is the primary sync path; this slow poll is a reconnect/safety net.
  useEffect(() => {
    const id = setInterval(() => {
      void refresh()
    }, 15000)
    return () => clearInterval(id)
  }, [refresh])

  // --- realtime --------------------------------------------------------------
  const presenceRef = useRef<PresenceUser[]>([])

  const handleSync = useCallback(
    (event: BoardSyncEvent) => {
      const nameFor = (userId: string) =>
        presenceRef.current.find((p) => p.userId === userId)?.name ?? null

      const normalize = (raw: Record<string, unknown>): CanvasEl => {
        const el = raw as unknown as CanvasEl
        return { ...el, authorName: el.authorName ?? nameFor(el.userId) }
      }

      switch (event.type) {
        case 'element:created': {
          const el = normalize(event.element)
          setElements((prev) =>
            prev.some((x) => x.id === el.id)
              ? prev.map((x) => (x.id === el.id ? el : x))
              : [...prev, el],
          )
          break
        }
        case 'element:updated': {
          const el = normalize(event.element)
          const drag = dragRef.current
          // Don't clobber an element the local user is actively manipulating.
          if (drag && drag.mode !== 'pan' && drag.id === el.id) break
          if (editingId === el.id) break
          setElements((prev) =>
            prev.map((x) =>
              x.id === el.id
                ? { ...el, authorName: x.authorName ?? el.authorName }
                : x,
            ),
          )
          break
        }
        case 'element:deleted': {
          setElements((prev) => prev.filter((x) => x.id !== event.id))
          break
        }
        default:
          break
      }
    },
    [editingId],
  )

  const { presence, cursors, selections, activity, sendCursor, sendSelection } =
    useBoardRealtime({
      teamId,
      board: 'retro',
      name: user?.name ?? 'Guest',
      enabled: !!user,
      onSync: handleSync,
    })
  presenceRef.current = presence

  // Broadcast the local selection/editing focus to other viewers.
  useEffect(() => {
    sendSelection(selectedId, editingId !== null)
  }, [selectedId, editingId, sendSelection])

  const onContainerPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const node = containerRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const v = vpRef.current
      sendCursor(
        (e.clientX - rect.left - v.panX) / v.zoom,
        (e.clientY - rect.top - v.panY) / v.zoom,
      )
    },
    [sendCursor],
  )

  // --- coordinate helpers ----------------------------------------------------
  const toWorld = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect()
    const v = vpRef.current
    return {
      x: (clientX - rect.left - v.panX) / v.zoom,
      y: (clientY - rect.top - v.panY) / v.zoom,
    }
  }, [])

  const worldToScreen = (x: number, y: number) => ({
    left: x * vp.zoom + vp.panX,
    top: y * vp.zoom + vp.panY,
  })

  // --- create element --------------------------------------------------------
  const placeElement = useCallback(
    async (worldX: number, worldY: number) => {
      const size = DEFAULTS[tool] ?? DEFAULTS.sticky
      const payload = {
        type: tool,
        content: tool === 'stamp' ? stamp : tool === 'frame' ? 'Frame' : '',
        color,
        shape: tool === 'shape' ? shape : null,
        x: Math.round(worldX - size.w / 2),
        y: Math.round(worldY - size.h / 2),
        w: size.w,
        h: size.h,
      }
      suppressRef.current = Date.now() + 2000
      try {
        const created = await createElement(teamId, payload)
        const withAuthor = {
          ...created,
          authorName: user?.name ?? null,
        } as CanvasEl
        setElements((prev) => [...prev, withAuthor])
        setSelectedId(created.id)
        if (tool === 'sticky' || tool === 'text') setEditingId(created.id)
        setTool('select')
      } catch (error) {
        console.error('create element failed', error)
      }
    },
    [tool, stamp, color, shape, teamId, user],
  )

  // --- background pointer down ----------------------------------------------
  const onBackgroundPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const world = toWorld(e.clientX, e.clientY)

    if (tool === 'line') {
      lineStartRef.current = world
      setLinePreview({ x: world.x, y: world.y, x2: world.x, y2: world.y })
      dragRef.current = {
        mode: 'pan',
        sx: e.clientX,
        sy: e.clientY,
        panX0: vp.panX,
        panY0: vp.panY,
      }
      attachWindow()
      return
    }

    if (tool === 'select' || tool === 'hand') {
      setSelectedId(null)
      setEditingId(null)
      dragRef.current = {
        mode: 'pan',
        sx: e.clientX,
        sy: e.clientY,
        panX0: vp.panX,
        panY0: vp.panY,
      }
      attachWindow()
      return
    }

    void placeElement(world.x, world.y)
  }

  // --- element / resize interactions ----------------------------------------
  const onElementPointerDown = (e: React.PointerEvent, el: CanvasEl) => {
    if (tool !== 'select') return
    setSelectedId(el.id)
    dragRef.current = {
      mode: 'move',
      id: el.id,
      sx: e.clientX,
      sy: e.clientY,
      x0: el.x,
      y0: el.y,
      zoom: vp.zoom,
      moved: false,
    }
    attachWindow()
  }

  const onResizeStart = (
    e: React.PointerEvent,
    el: CanvasEl,
    handle: ResizeHandle,
  ) => {
    dragRef.current = {
      mode: 'resize',
      id: el.id,
      handle,
      sx: e.clientX,
      sy: e.clientY,
      x0: el.x,
      y0: el.y,
      w0: el.w,
      h0: el.h,
      zoom: vp.zoom,
    }
    attachWindow()
  }

  // --- window move/up --------------------------------------------------------
  const attachWindow = () => {
    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
  }
  const detachWindow = () => {
    window.removeEventListener('pointermove', onWindowMove)
    window.removeEventListener('pointerup', onWindowUp)
  }

  const onWindowMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current

      if (lineStartRef.current) {
        const world = toWorld(e.clientX, e.clientY)
        const s = lineStartRef.current
        setLinePreview({ x: s.x, y: s.y, x2: world.x, y2: world.y })
        return
      }

      if (!drag) return

      if (drag.mode === 'pan') {
        setVp((v) => ({
          ...v,
          panX: drag.panX0 + (e.clientX - drag.sx),
          panY: drag.panY0 + (e.clientY - drag.sy),
        }))
        return
      }

      if (drag.mode === 'move') {
        const dx = (e.clientX - drag.sx) / drag.zoom
        const dy = (e.clientY - drag.sy) / drag.zoom
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) drag.moved = true
        setElements((prev) =>
          prev.map((el) =>
            el.id === drag.id
              ? { ...el, x: Math.round(drag.x0 + dx), y: Math.round(drag.y0 + dy) }
              : el,
          ),
        )
        return
      }

      if (drag.mode === 'resize') {
        const dx = (e.clientX - drag.sx) / drag.zoom
        const dy = (e.clientY - drag.sy) / drag.zoom
        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== drag.id) return el
            const { x0, y0, w0, h0 } = drag
            let x = x0
            let y = y0
            let w = w0
            let h = h0
            if (drag.handle === 'se') {
              w = w0 + dx
              h = h0 + dy
            } else if (drag.handle === 'ne') {
              w = w0 + dx
              h = h0 - dy
              y = y0 + dy
            } else if (drag.handle === 'sw') {
              w = w0 - dx
              x = x0 + dx
              h = h0 + dy
            } else {
              w = w0 - dx
              x = x0 + dx
              h = h0 - dy
              y = y0 + dy
            }
            if (w < 40) w = 40
            if (h < 40) h = 40
            return {
              ...el,
              x: Math.round(x),
              y: Math.round(y),
              w: Math.round(w),
              h: Math.round(h),
            }
          }),
        )
        return
      }
    },
    [toWorld],
  )

  const onWindowUp = useCallback(
    (e: PointerEvent) => {
      detachWindow()
      suppressRef.current = Date.now() + 1800

      if (lineStartRef.current) {
        const s = lineStartRef.current
        const world = toWorld(e.clientX, e.clientY)
        lineStartRef.current = null
        setLinePreview(null)
        dragRef.current = null
        const w = world.x - s.x
        const h = world.y - s.y
        if (Math.abs(w) + Math.abs(h) > 8) {
          suppressRef.current = Date.now() + 2000
          createElement(teamId, {
            type: 'line',
            color,
            x: Math.round(s.x),
            y: Math.round(s.y),
            w: Math.round(w),
            h: Math.round(h),
          })
            .then((created) => {
              const el = {
                ...created,
                authorName: user?.name ?? null,
              } as CanvasEl
              setElements((prev) => [...prev, el])
            })
            .catch(() => refresh())
        }
        setTool('select')
        return
      }

      const drag = dragRef.current
      dragRef.current = null
      if (!drag) return

      if (drag.mode === 'move' && drag.moved) {
        const el = elementsRef.current.find((x) => x.id === drag.id)
        if (el)
          void updateElement(drag.id, { x: el.x, y: el.y }).catch(() => refresh())
      }
      if (drag.mode === 'resize') {
        const el = elementsRef.current.find((x) => x.id === drag.id)
        if (el)
          void updateElement(drag.id, {
            x: el.x,
            y: el.y,
            w: el.w,
            h: el.h,
          }).catch(() => refresh())
      }
    },
    [toWorld, teamId, color, user, refresh],
  )

  const elementsRef = useRef(elements)
  elementsRef.current = elements

  useEffect(() => () => detachWindow(), [])

  // --- wheel zoom / pan ------------------------------------------------------
  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = node.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        setVp((v) => {
          const factor = Math.exp(-e.deltaY * 0.01)
          const z2 = clampZoom(v.zoom * factor)
          const cx = e.clientX - rect.left
          const cy = e.clientY - rect.top
          const worldX = (cx - v.panX) / v.zoom
          const worldY = (cy - v.panY) / v.zoom
          return { zoom: z2, panX: cx - worldX * z2, panY: cy - worldY * z2 }
        })
      } else {
        setVp((v) => ({ ...v, panX: v.panX - e.deltaX, panY: v.panY - e.deltaY }))
      }
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [])

  // --- keyboard --------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editingId !== null) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 'Escape') {
        setSelectedId(null)
        setTool('select')
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null) {
        const el = elementsRef.current.find((x) => x.id === selectedId)
        if (el && el.userId === currentUserId) {
          handleDelete(selectedId)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, editingId, currentUserId])

  // --- element ops -----------------------------------------------------------
  const handleCommit = (el: CanvasEl, content: string) => {
    setEditingId(null)
    const trimmed = content.trim()
    if (
      (el.type === 'sticky' || el.type === 'text') &&
      trimmed === '' &&
      el.content === ''
    ) {
      setElements((prev) => prev.filter((x) => x.id !== el.id))
      void deleteElement(el.id).catch(() => refresh())
      return
    }
    if (trimmed === el.content) return
    suppressRef.current = Date.now() + 1500
    setElements((prev) =>
      prev.map((x) => (x.id === el.id ? { ...x, content: trimmed } : x)),
    )
    void updateElement(el.id, { content: trimmed }).catch(() => refresh())
  }

  const handleColor = (id: number, c: string) => {
    suppressRef.current = Date.now() + 1500
    setElements((prev) => prev.map((x) => (x.id === id ? { ...x, color: c } : x)))
    void updateElement(id, { color: c }).catch(() => refresh())
  }

  const handleVote = (el: CanvasEl) => {
    suppressRef.current = Date.now() + 1500
    setElements((prev) =>
      prev.map((x) => (x.id === el.id ? { ...x, votes: x.votes + 1 } : x)),
    )
    void voteElement(el.id).catch(() => refresh())
  }

  const handleDelete = (id: number) => {
    suppressRef.current = Date.now() + 1500
    setElements((prev) => prev.filter((x) => x.id !== id))
    setSelectedId(null)
    void deleteElement(id).catch(() => refresh())
  }

  const handleZ = (id: number, dir: 'front' | 'back') => {
    suppressRef.current = Date.now() + 1500
    const zs = elementsRef.current.map((e) => e.z)
    const next = dir === 'front' ? Math.max(...zs) + 1 : Math.min(...zs) - 1
    setElements((prev) => prev.map((x) => (x.id === id ? { ...x, z: next } : x)))
    void updateElement(id, { z: next }).catch(() => refresh())
  }

  const resetView = () => setVp({ panX: 0, panY: 0, zoom: 1 })

  const selected = elements.find((e) => e.id === selectedId) ?? null
  // Until the socket reports presence, show the static roster so the bar isn't empty.
  const fallbackPresence: PresenceUser[] = members.map((m) => ({
    userId: m.userId,
    name: m.name ?? 'User',
    board: null,
  }))
  const cursorClass =
    tool === 'hand'
      ? 'cursor-grab'
      : tool === 'select'
        ? 'cursor-default'
        : 'cursor-crosshair'

  return (
    <div
      ref={containerRef}
      onPointerDown={onBackgroundPointerDown}
      onPointerMove={onContainerPointerMove}
      className={cn(
        'relative h-full w-full touch-none overflow-hidden bg-[#f1f3f5] select-none',
        cursorClass,
      )}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate(${vp.panX}px, ${vp.panY}px) scale(${vp.zoom})`,
        }}
      >
        <div
          className="pointer-events-none absolute"
          style={{
            left: -2000,
            top: -2000,
            width: 8000,
            height: 8000,
            backgroundImage:
              'radial-gradient(circle, rgba(15,23,42,0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <svg
          className="absolute left-0 top-0 overflow-visible"
          width={1}
          height={1}
          style={{ pointerEvents: 'none' }}
        >
          {elements
            .filter((el) => el.type === 'line')
            .map((el) => {
              const isSel = el.id === selectedId
              return (
                <g key={el.id}>
                  <line
                    x1={el.x}
                    y1={el.y}
                    x2={el.x + el.w}
                    y2={el.y + el.h}
                    stroke={colorBorder(el.color)}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  <line
                    x1={el.x}
                    y1={el.y}
                    x2={el.x + el.w}
                    y2={el.y + el.h}
                    stroke="transparent"
                    strokeWidth={16}
                    strokeLinecap="round"
                    style={{ pointerEvents: tool === 'select' ? 'stroke' : 'none' }}
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      onElementPointerDown(e as unknown as React.PointerEvent, el)
                    }}
                  />
                  {isSel && (
                    <>
                      <circle cx={el.x} cy={el.y} r={5} fill="#fff" stroke="#0ea5e9" strokeWidth={2} />
                      <circle cx={el.x + el.w} cy={el.y + el.h} r={5} fill="#fff" stroke="#0ea5e9" strokeWidth={2} />
                    </>
                  )}
                </g>
              )
            })}
          {linePreview && (
            <line
              x1={linePreview.x}
              y1={linePreview.y}
              x2={linePreview.x2}
              y2={linePreview.y2}
              stroke="#0ea5e9"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          )}
        </svg>

        {elements
          .filter((el) => el.type !== 'line')
          .map((el) => (
            <CanvasElement
              key={el.id}
              element={el}
              selected={el.id === selectedId}
              editing={el.id === editingId}
              interactive={tool === 'select'}
              onPointerDown={onElementPointerDown}
              onResizeStart={onResizeStart}
              onStartEdit={(x) => setEditingId(x.id)}
              onCommit={handleCommit}
              onVote={handleVote}
            />
          ))}

        {Object.values(selections).map((s) => {
          if (s.elementId == null) return null
          const el = elements.find((e) => e.id === s.elementId)
          if (!el || el.type === 'line') return null
          const color = userColor(s.userId)
          return (
            <div
              key={s.socketId}
              className="pointer-events-none absolute rounded-lg"
              style={{
                left: el.x,
                top: el.y,
                width: el.w,
                height: el.h,
                border: `2px solid ${color}`,
              }}
            >
              <span
                className="absolute -top-5 left-0 whitespace-nowrap rounded px-1 text-[10px] font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {s.name}
                {s.editing ? ' (editing)' : ''}
              </span>
            </div>
          )
        })}
      </div>

      <RemoteCursors
        cursors={cursors}
        currentUserId={currentUserId}
        project={(c) => ({
          left: c.x * vp.zoom + vp.panX,
          top: c.y * vp.zoom + vp.panY,
        })}
      />

      {selected &&
        editingId === null &&
        (() => {
          const pos = worldToScreen(selected.x + selected.w / 2, selected.y)
          return (
            <ElementToolbar
              element={selected}
              left={pos.left}
              top={pos.top}
              canDelete={selected.userId === currentUserId}
              onColor={(c) => handleColor(selected.id, c)}
              onVote={() => handleVote(selected)}
              onBringFront={() => handleZ(selected.id, 'front')}
              onSendBack={() => handleZ(selected.id, 'back')}
              onDelete={() => handleDelete(selected.id)}
            />
          )
        })()}

      <div className="absolute right-5 top-4 z-30 flex items-center gap-3">
        <PresenceBar
          users={presence.length > 0 ? presence : fallbackPresence}
          currentUserId={currentUserId}
        />
        <ActivityFeed entries={activity} currentUserId={currentUserId} />
      </div>

      <CanvasToolbar
        tool={tool}
        setTool={setTool}
        shape={shape}
        setShape={setShape}
        stamp={stamp}
        setStamp={setStamp}
        color={color}
        setColor={setColor}
      />

      <ZoomControls
        zoom={vp.zoom}
        onZoomIn={() => setVp((v) => ({ ...v, zoom: clampZoom(v.zoom * 1.2) }))}
        onZoomOut={() => setVp((v) => ({ ...v, zoom: clampZoom(v.zoom / 1.2) }))}
        onReset={resetView}
      />
    </div>
  )
}
