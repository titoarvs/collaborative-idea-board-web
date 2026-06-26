import { useState } from 'react'
import {
  type Tool,
  type ShapeKind,
  SHAPES,
  STAMPS,
  STAMP_EMOJI,
  STICKY_COLORS,
  COLORS,
} from '@/lib/canvas/types'
import {
  MousePointer2,
  Hand,
  StickyNote,
  Type,
  Minus,
  Frame,
  Sticker,
  Square,
  Circle,
  Triangle,
  Diamond,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  tool: Tool
  setTool: (t: Tool) => void
  shape: ShapeKind
  setShape: (s: ShapeKind) => void
  stamp: string
  setStamp: (s: string) => void
  color: string
  setColor: (c: string) => void
}

const SHAPE_ICON: Record<ShapeKind, React.ElementType> = {
  rect: Square,
  ellipse: Circle,
  triangle: Triangle,
  diamond: Diamond,
  star: Star,
}

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function CanvasToolbar({
  tool,
  setTool,
  shape,
  setShape,
  stamp,
  setStamp,
  color,
  setColor,
}: Props) {
  const [openMenu, setOpenMenu] = useState<'shape' | 'stamp' | 'color' | null>(
    null,
  )

  const ShapeIcon = SHAPE_ICON[shape]

  return (
    <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2">
      <div className="relative flex items-center gap-1 rounded-2xl border border-border bg-card px-2 py-1.5 shadow-xl">
        <ToolButton active={tool === 'select'} onClick={() => setTool('select')} title="Select / move">
          <MousePointer2 className="h-5 w-5" />
        </ToolButton>
        <ToolButton active={tool === 'hand'} onClick={() => setTool('hand')} title="Pan">
          <Hand className="h-5 w-5" />
        </ToolButton>

        <span className="mx-0.5 h-6 w-px bg-border" />

        <ToolButton active={tool === 'sticky'} onClick={() => setTool('sticky')} title="Sticky note">
          <StickyNote className="h-5 w-5" />
        </ToolButton>
        <ToolButton active={tool === 'text'} onClick={() => setTool('text')} title="Text">
          <Type className="h-5 w-5" />
        </ToolButton>

        <div className="relative">
          <button
            type="button"
            title="Shape"
            onClick={() => {
              setTool('shape')
              setOpenMenu(openMenu === 'shape' ? null : 'shape')
            }}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
              tool === 'shape'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <ShapeIcon className="h-5 w-5" />
          </button>
          {openMenu === 'shape' && (
            <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-1 rounded-xl border border-border bg-card p-1.5 shadow-xl">
              {SHAPES.map((s) => {
                const Icon = SHAPE_ICON[s.key]
                return (
                  <button
                    key={s.key}
                    type="button"
                    title={s.label}
                    onClick={() => {
                      setShape(s.key)
                      setTool('shape')
                      setOpenMenu(null)
                    }}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                      shape === s.key
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <ToolButton active={tool === 'line'} onClick={() => setTool('line')} title="Line / connector">
          <Minus className="h-5 w-5 -rotate-45" />
        </ToolButton>
        <ToolButton active={tool === 'frame'} onClick={() => setTool('frame')} title="Frame">
          <Frame className="h-5 w-5" />
        </ToolButton>

        <div className="relative">
          <button
            type="button"
            title="Stamp"
            onClick={() => {
              setTool('stamp')
              setOpenMenu(openMenu === 'stamp' ? null : 'stamp')
            }}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
              tool === 'stamp'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Sticker className="h-5 w-5" />
          </button>
          {openMenu === 'stamp' && (
            <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-1 rounded-xl border border-border bg-card p-1.5 shadow-xl">
              {STAMPS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStamp(s)
                    setTool('stamp')
                    setOpenMenu(null)
                  }}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-colors',
                    stamp === s ? 'bg-accent' : 'hover:bg-muted',
                  )}
                >
                  {STAMP_EMOJI[s]}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="mx-0.5 h-6 w-px bg-border" />

        <div className="relative">
          <button
            type="button"
            title="Default color"
            onClick={() => setOpenMenu(openMenu === 'color' ? null : 'color')}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
          >
            <span
              className={cn(
                'h-5 w-5 rounded-full ring-1 ring-black/10',
                COLORS.find((c) => c.key === color)?.swatch,
              )}
            />
          </button>
          {openMenu === 'color' && (
            <div className="absolute bottom-12 right-0 flex gap-1 rounded-xl border border-border bg-card p-1.5 shadow-xl">
              {STICKY_COLORS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setColor(key)
                    setOpenMenu(null)
                  }}
                  className={cn(
                    'h-7 w-7 rounded-full ring-offset-2 transition-all',
                    COLORS.find((c) => c.key === key)?.swatch,
                    color === key && 'ring-2 ring-foreground',
                  )}
                  aria-label={`Color ${key}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
