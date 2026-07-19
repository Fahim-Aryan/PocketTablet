import { usePointerCapture } from '../../../shared/hooks/usePointerCapture'
import type { ToolState, StrokePoint } from '../../../shared/types/drawing'

interface TabletSurfaceProps {
  tool: ToolState
  onStrokeStart: (point: StrokePoint, tool: ToolState) => void
  onStrokeMove: (points: StrokePoint[]) => void
  onStrokeEnd: () => void
  enabled?: boolean
}

export function TabletSurface({
  tool,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
  enabled = true,
}: TabletSurfaceProps) {
  const { surfaceRef } = usePointerCapture({
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
    tool,
    enabled,
  })

  return (
    <div
      ref={surfaceRef}
      className="absolute inset-0 touch-none select-none bg-zinc-950"
      style={{
        overscrollBehavior: 'contain',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <div className="flex h-full w-full items-center justify-center">
        <p className="select-none text-sm font-medium tracking-wide text-zinc-700">
          {enabled ? 'Draw here' : 'Connect to start drawing'}
        </p>
      </div>
    </div>
  )
}
