export type ElementType =
  | 'sticky'
  | 'text'
  | 'shape'
  | 'line'
  | 'frame'
  | 'stamp'

export type ShapeKind = 'rect' | 'ellipse' | 'triangle' | 'diamond' | 'star'

export type Tool =
  | 'select'
  | 'hand'
  | 'sticky'
  | 'text'
  | 'shape'
  | 'line'
  | 'frame'
  | 'stamp'

export interface CanvasElement {
  id: number
  teamId: number
  userId: string
  type: ElementType
  content: string
  color: string
  shape: string | null
  x: number
  y: number
  w: number
  h: number
  rotation: number
  z: number
  votes: number
  createdAt: Date | string
  authorName: string | null
}

export interface Member {
  userId: string
  name: string | null
  role: string
}

export interface Viewport {
  panX: number
  panY: number
  zoom: number
}

export const MIN_ZOOM = 0.2
export const MAX_ZOOM = 2.5

export const COLORS: { key: string; swatch: string; fill: string; border: string }[] = [
  { key: 'yellow', swatch: 'bg-amber-300', fill: '#fef3c7', border: '#fde68a' },
  { key: 'blue', swatch: 'bg-sky-300', fill: '#e0f2fe', border: '#bae6fd' },
  { key: 'sky', swatch: 'bg-sky-300', fill: '#e0f2fe', border: '#7dd3fc' },
  { key: 'pink', swatch: 'bg-pink-300', fill: '#fce7f3', border: '#fbcfe8' },
  { key: 'green', swatch: 'bg-green-300', fill: '#dcfce7', border: '#86efac' },
  { key: 'rose', swatch: 'bg-rose-300', fill: '#ffe4e6', border: '#fda4af' },
  { key: 'orange', swatch: 'bg-orange-300', fill: '#ffedd5', border: '#fdba74' },
  { key: 'violet', swatch: 'bg-violet-300', fill: '#ede9fe', border: '#c4b5fd' },
]

export const STICKY_COLORS = ['yellow', 'blue', 'pink', 'green', 'orange', 'violet']

export const SHAPES: { key: ShapeKind; label: string }[] = [
  { key: 'rect', label: 'Rectangle' },
  { key: 'ellipse', label: 'Ellipse' },
  { key: 'triangle', label: 'Triangle' },
  { key: 'diamond', label: 'Diamond' },
  { key: 'star', label: 'Star' },
]

export const STAMPS = ['heart', 'thumb', 'fire', 'star', 'check', 'spark'] as const
export const STAMP_EMOJI: Record<string, string> = {
  heart: '\u2764\uFE0F',
  thumb: '\uD83D\uDC4D',
  fire: '\uD83D\uDD25',
  star: '\u2B50',
  check: '\u2705',
  spark: '\u2728',
}

export function colorFill(color: string) {
  return COLORS.find((c) => c.key === color)?.fill ?? COLORS[0].fill
}

export function colorBorder(color: string) {
  return COLORS.find((c) => c.key === color)?.border ?? COLORS[0].border
}

export function initials(value: string) {
  const parts = value.trim().split(/\s+/)
  if (parts.length === 0 || parts[0] === '') return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Convert a screen point (relative to the canvas container) to world coords. */
export function screenToWorld(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  vp: Viewport,
) {
  return {
    x: (clientX - rect.left - vp.panX) / vp.zoom,
    y: (clientY - rect.top - vp.panY) / vp.zoom,
  }
}

export function clampZoom(z: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
}
