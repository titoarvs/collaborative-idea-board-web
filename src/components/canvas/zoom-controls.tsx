import { Plus, Minus, Maximize } from 'lucide-react'

interface Props {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

export function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }: Props) {
  return (
    <div className="absolute bottom-5 right-5 z-30 flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
      <button
        type="button"
        onClick={onZoomIn}
        className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex h-9 w-9 items-center justify-center text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex h-9 w-9 items-center justify-center border-t border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Fit to screen"
      >
        <Maximize className="h-4 w-4" />
      </button>
    </div>
  )
}
