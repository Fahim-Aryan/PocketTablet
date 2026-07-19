import { useRef, useEffect, useCallback } from 'react'
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const toolRef = useRef(tool)
  const canDrawRef = useRef(canDraw)
  toolRef.current = tool
  canDrawRef.current = canDraw

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    ctxRef.current = canvas.getContext('2d')
  }, [])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  const drawOnCanvas = useCallback((point: StrokePoint, startNew: boolean) => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return

    const x = point.x * canvas.width
    const y = point.y * canvas.height
    const t = toolRef.current

    if (t.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = t.opacity
    }

    const width = (t.tool === 'eraser' ? t.strokeWidth * 3 : t.strokeWidth) * (0.4 + point.pressure * 0.6)
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = t.color

    if (!startNew && lastPoint.current) {
      ctx.beginPath()
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.arc(x, y, width / 2, 0, Math.PI * 2)
      ctx.fill()
    }

    lastPoint.current = { x, y }
  }, [])

  const handleLocalStart = useCallback((point: StrokePoint, t: ToolState) => {
    isDrawing.current = true
    lastPoint.current = null
    drawOnCanvas(point, true)
    onStrokeStart(point, t)
  }, [drawOnCanvas, onStrokeStart])

  const handleLocalMove = useCallback((points: StrokePoint[]) => {
    points.forEach((p) => drawOnCanvas(p, false))
    onStrokeMove(points)
  }, [drawOnCanvas, onStrokeMove])

  const handleLocalEnd = useCallback(() => {
    isDrawing.current = false
    lastPoint.current = null
    onStrokeEnd()
  }, [onStrokeEnd])

  const { surfaceRef } = usePointerCapture({
    onStrokeStart: handleLocalStart,
    onStrokeMove: handleLocalMove,
    onStrokeEnd: handleLocalEnd,
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
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
        />
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
