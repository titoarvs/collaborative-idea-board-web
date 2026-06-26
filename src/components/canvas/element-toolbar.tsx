import { type CanvasElement, STICKY_COLORS, COLORS } from '@/lib/canvas/types'
import { Heart, Trash2, BringToFront, SendToBack } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  element: CanvasElement
  left: number
  top: number
  canDelete: boolean
  onColor: (color: string) => void
  onVote: () => void
  onBringFront: () => void
  onSendBack: () => void
  onDelete: () => void
}

export function ElementToolbar({
  element,
  left,
  top,
  canDelete,
  onColor,
  onVote,
  onBringFront,
  onSendBack,
  onDelete,
}: Props) {
  const showColors =
    element.type === 'sticky' ||
    element.type === 'shape' ||
    element.type === 'frame' ||
    element.type === 'text'
  const showVote = element.type === 'sticky'

  return (
    <div
      className="absolute z-40 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-lg border border-border bg-card px-1.5 py-1 shadow-xl"
      style={{ left, top: top - 10 }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {showColors &&
        STICKY_COLORS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onColor(key)}
            className={cn(
              'h-5 w-5 rounded-full ring-offset-1 transition-all',
              COLORS.find((c) => c.key === key)?.swatch,
              element.color === key && 'ring-2 ring-foreground',
            )}
            aria-label={`Color ${key}`}
          />
        ))}

      {showColors && <span className="mx-0.5 h-5 w-px bg-border" />}

      {showVote && (
        <button
          type="button"
          onClick={onVote}
          className="flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/10"
          title="React"
        >
          <Heart className="h-4 w-4" />
          {element.votes > 0 && element.votes}
        </button>
      )}

      <button
        type="button"
        onClick={onBringFront}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        title="Bring to front"
      >
        <BringToFront className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onSendBack}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        title="Send to back"
      >
        <SendToBack className="h-4 w-4" />
      </button>

      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
