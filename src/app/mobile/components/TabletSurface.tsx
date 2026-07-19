import { usePointerCapture } from '../../../shared/hooks/usePointerCapture'
import type { ToolState, StrokePoint } from '../../../shared/types/drawing'

interface TabletSurfaceProps {
  tool: ToolState
  onStrokeStart: (point: StrokePoint, tool: ToolState) => void
  onStrokeMove: (points: StrokePoint[]) => void
  onStrokeEnd: () => void
  enabled?: boolean
  canDraw?: boolean
  pressure: number
}

export function TabletSurface({
  tool,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
  enabled = true,
  canDraw = true,
  pressure: _pressure,
}: TabletSurfaceProps) {
  const { surfaceRef } = usePointerCapture({
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
    tool,
    enabled,
    canDraw,
  })

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 p-1.5">
      <div
        className="relative h-full w-full overflow-hidden rounded-xl border-[2px] border-zinc-700"
        style={{
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div
          ref={surfaceRef}
          className="absolute inset-0 z-10"
          style={{ touchAction: 'none' }}
        />
        {!canDraw && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <span className="rounded-full bg-zinc-900/60 px-3 py-1 text-[10px] font-medium text-zinc-500 backdrop-blur-sm">
              Hold left button to draw
            </span>
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
        />
      </div>
    </div>
  )
}
