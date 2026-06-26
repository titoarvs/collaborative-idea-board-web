import { useEffect, useRef } from 'react'
import {
  type CanvasElement as CanvasEl,
  STAMP_EMOJI,
  colorFill,
  colorBorder,
  initials,
} from '@/lib/canvas/types'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

interface Props {
  element: CanvasEl
  selected: boolean
  editing: boolean
  interactive: boolean
  onPointerDown: (e: React.PointerEvent, el: CanvasEl) => void
  onResizeStart: (e: React.PointerEvent, el: CanvasEl, handle: ResizeHandle) => void
  onStartEdit: (el: CanvasEl) => void
  onCommit: (el: CanvasEl, content: string) => void
  onVote: (el: CanvasEl) => void
}

function starPoints(w: number, h: number) {
  const cx = w / 2
  const cy = h / 2
  const outer = Math.min(w, h) / 2 - 1
  const inner = outer * 0.4
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
  }
  return pts.join(' ')
}

const RESIZE_HANDLES: { key: ResizeHandle; cls: string; cursor: string }[] = [
  { key: 'nw', cls: '-left-1.5 -top-1.5', cursor: 'nwse-resize' },
  { key: 'ne', cls: '-right-1.5 -top-1.5', cursor: 'nesw-resize' },
  { key: 'sw', cls: '-left-1.5 -bottom-1.5', cursor: 'nesw-resize' },
  { key: 'se', cls: '-right-1.5 -bottom-1.5', cursor: 'nwse-resize' },
]

export function CanvasElement({
  element,
  selected,
  editing,
  interactive,
  onPointerDown,
  onResizeStart,
  onStartEdit,
  onCommit,
  onVote,
}: Props) {
  const textRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus()
      textRef.current.select()
    }
  }, [editing])

  const fill = colorFill(element.color)
  const border = colorBorder(element.color)
  const canResize =
    element.type === 'sticky' ||
    element.type === 'frame' ||
    element.type === 'shape' ||
    element.type === 'text'

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.w,
    height: element.h,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    zIndex: element.type === 'frame' ? 1 : 5 + element.z,
    pointerEvents: interactive ? 'auto' : 'none',
  }

  const selectionRing = selected
    ? 'outline outline-2 outline-sky-500 outline-offset-2'
    : ''

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!interactive) return
    e.stopPropagation()
    onPointerDown(e, element)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!interactive) return
    e.stopPropagation()
    if (element.type === 'sticky' || element.type === 'text' || element.type === 'frame') {
      onStartEdit(element)
    }
  }

  const resizeHandles =
    selected && interactive && canResize ? (
      <>
        {RESIZE_HANDLES.map((h) => (
          <div
            key={h.key}
            onPointerDown={(e) => {
              e.stopPropagation()
              onResizeStart(e, element, h.key)
            }}
            style={{ cursor: h.cursor }}
            className={cn(
              'absolute h-3 w-3 rounded-full border-2 border-sky-500 bg-white',
              h.cls,
            )}
          />
        ))}
      </>
    ) : null

  if (element.type === 'frame') {
    return (
      <div
        style={baseStyle}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        className={cn('group rounded-xl', selectionRing)}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed"
          style={{ borderColor: border, background: `${fill}40` }}
        />
        <div className="absolute -top-7 left-0 flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: border }} />
          {editing ? (
            <input
              ref={textRef as unknown as React.RefObject<HTMLInputElement>}
              defaultValue={element.content}
              onPointerDown={(e) => e.stopPropagation()}
              onBlur={(e) => onCommit(element, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
              className="rounded border border-border bg-card px-1 text-sm font-semibold text-foreground outline-none"
            />
          ) : (
            <span className="text-sm font-semibold text-slate-700">
              {element.content || 'Frame'}
            </span>
          )}
        </div>
        {resizeHandles}
      </div>
    )
  }

  if (element.type === 'shape') {
    const w = element.w
    const h = element.h
    return (
      <div
        style={baseStyle}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        className={cn('group cursor-grab active:cursor-grabbing', selectionRing)}
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          {element.shape === 'ellipse' && (
            <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 1} ry={h / 2 - 1} fill={fill} stroke={border} strokeWidth={2} />
          )}
          {element.shape === 'triangle' && (
            <polygon points={`${w / 2},2 ${w - 2},${h - 2} 2,${h - 2}`} fill={fill} stroke={border} strokeWidth={2} />
          )}
          {element.shape === 'diamond' && (
            <polygon points={`${w / 2},2 ${w - 2},${h / 2} ${w / 2},${h - 2} 2,${h / 2}`} fill={fill} stroke={border} strokeWidth={2} />
          )}
          {element.shape === 'star' && (
            <polygon points={starPoints(w, h)} fill={fill} stroke={border} strokeWidth={2} />
          )}
          {(element.shape === 'rect' || !element.shape) && (
            <rect x={1} y={1} width={w - 2} height={h - 2} rx={10} fill={fill} stroke={border} strokeWidth={2} />
          )}
        </svg>
        {resizeHandles}
      </div>
    )
  }

  if (element.type === 'stamp') {
    return (
      <div
        style={{ ...baseStyle, width: 'auto', height: 'auto' }}
        onPointerDown={handlePointerDown}
        className={cn('select-none text-3xl leading-none', selectionRing)}
      >
        {STAMP_EMOJI[element.content] ?? '\u2B50'}
      </div>
    )
  }

  if (element.type === 'text') {
    return (
      <div
        style={baseStyle}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        className={cn('group', selectionRing)}
      >
        {editing ? (
          <textarea
            ref={textRef}
            defaultValue={element.content}
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={(e) => onCommit(element, e.target.value)}
            className="h-full w-full resize-none bg-transparent p-1 text-base font-medium text-slate-800 outline-none"
          />
        ) : (
          <p className="h-full w-full whitespace-pre-wrap wrap-break-word p-1 text-base font-medium text-slate-800">
            {element.content || 'Text'}
          </p>
        )}
        {resizeHandles}
      </div>
    )
  }

  return (
    <div
      style={baseStyle}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'group flex cursor-grab flex-col rounded-md p-3 shadow-md active:cursor-grabbing',
        selectionRing,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-md border"
        style={{ background: fill, borderColor: border }}
      />
      <div className="relative flex-1 overflow-hidden">
        {editing ? (
          <textarea
            ref={textRef}
            defaultValue={element.content}
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={(e) => onCommit(element, e.target.value)}
            className="h-full w-full resize-none bg-transparent text-sm leading-snug text-slate-800 outline-none"
          />
        ) : (
          <p className="whitespace-pre-wrap wrap-break-word text-sm leading-snug text-slate-800">
            {element.content}
          </p>
        )}
      </div>
      <div className="relative mt-1.5 flex items-center justify-between border-t border-black/5 pt-1.5">
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-white">
            {initials(element.authorName || 'User')}
          </span>
          <span className="max-w-20 truncate text-[11px] text-slate-600">
            {element.authorName || 'User'}
          </span>
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onVote(element)
          }}
          className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-500/10"
        >
          <Heart className="h-3.5 w-3.5" />
          {element.votes > 0 && element.votes}
        </button>
      </div>
      {resizeHandles}
    </div>
  )
}
