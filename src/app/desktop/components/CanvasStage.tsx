import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import type Konva from 'konva'
import { Stage, Layer, Line, Rect, Ellipse, Circle } from 'react-konva'
import type { StrokePoint, ToolState } from '../../../shared/types/drawing'

interface Stroke {
  id: string
  tool: ToolState
  points: number[]
  isActive: boolean
}

interface CursorState {
  x: number
  y: number
  visible: boolean
  tool: ToolState
}

export interface CanvasStageHandle {
  handleStrokeStart: (point: StrokePoint, tool: ToolState, strokeId: string) => void
  handleStrokeMove: (points: StrokePoint[], strokeId: string) => void
  handleStrokeEnd: (strokeId: string) => void
  handleClear: () => void
  handleUndo: () => void
  handleExport: () => string | undefined
  setCursor: (point: StrokePoint, tool: ToolState) => void
  hideCursor: () => void
}

export const CanvasStage = forwardRef<CanvasStageHandle>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [stageScale, setStageScale] = useState(1)
  const [stageX, setStageX] = useState(0)
  const [stageY, setStageY] = useState(0)
  const [cursor, setCursor] = useState<CursorState | null>(null)
  const isPanning = useRef(false)

  useEffect(() => {
    const onResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const normalizeToCanvas = useCallback((point: StrokePoint) => {
    return {
      x: point.x * dimensions.width * stageScale + stageX,
      y: point.y * dimensions.height * stageScale + stageY,
    }
  }, [dimensions, stageScale, stageX, stageY])

  useImperativeHandle(ref, () => ({
    handleStrokeStart(point, tool, strokeId) {
      const { x, y } = normalizeToCanvas(point)
      setCursor({ x, y, visible: true, tool })
      setStrokes((prev) => [...prev, { id: strokeId, tool, points: [x, y], isActive: true }])
    },
    handleStrokeMove(points, strokeId) {
      const canvasPoints = points.flatMap((p) => {
        const { x, y } = normalizeToCanvas(p)
        return [x, y]
      })
      const last = points[points.length - 1]
      if (last) {
        const { x, y } = normalizeToCanvas(last)
        setCursor((prev) => prev ? { ...prev, x, y } : null)
      }
      setStrokes((prev) =>
        prev.map((s) =>
          s.id === strokeId && s.isActive
            ? { ...s, points: [...s.points, ...canvasPoints] }
            : s
        )
      )
    },
    handleStrokeEnd(_strokeId) {
      setCursor((prev) => prev ? { ...prev, visible: false } : null)
      setStrokes((prev) =>
        prev.map((s) => (s.id === _strokeId ? { ...s, isActive: false } : s))
      )
    },
    handleClear() {
      setStrokes([])
      setCursor(null)
    },
    handleUndo() {
      setStrokes((prev) => prev.slice(0, -1))
    },
    handleExport() {
      return stageRef.current?.toDataURL({ pixelRatio: 2 })
    },
    setCursor(point, tool) {
      const { x, y } = normalizeToCanvas(point)
      setCursor({ x, y, visible: true, tool })
    },
    hideCursor() {
      setCursor((prev) => prev ? { ...prev, visible: false } : null)
    },
  }), [normalizeToCanvas])

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const scaleBy = 1.08
    const stage = stageRef.current
    if (!stage) return
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    const mousePointTo = {
      x: (pointer.x - stageX) / oldScale,
      y: (pointer.y - stageY) / oldScale,
    }

    setStageScale(Math.max(0.1, Math.min(10, newScale)))
    setStageX(pointer.x - mousePointTo.x * newScale)
    setStageY(pointer.y - mousePointTo.y * newScale)
  }, [stageX, stageY])

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1 || e.evt.shiftKey) {
      isPanning.current = true
      const container = stageRef.current?.container()
      if (container) container.style.cursor = 'grabbing'
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
    const container = stageRef.current?.container()
    if (container) container.style.cursor = 'grab'
  }, [])

  const resetView = useCallback(() => {
    setStageScale(1)
    setStageX(0)
    setStageY(0)
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 bg-zinc-50 dark:bg-zinc-950">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stageX}
        y={stageY}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        draggable={false}
        className="cursor-grab"
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={dimensions.width}
            height={dimensions.height}
            fill="#FAFAFA"
            listening={false}
          />
        </Layer>
        <Layer>
          {strokes.length === 0 && (
            <Circle
              x={dimensions.width / 2}
              y={dimensions.height / 2 - 10}
              radius={0}
              listening={false}
            />
          )}
          {strokes.map((stroke) => {
            const base = {
              stroke: stroke.tool.tool === 'eraser' ? '#ffffff' : stroke.tool.color,
              strokeWidth: Math.max(1, stroke.tool.strokeWidth * (stageScale || 1)),
              opacity: stroke.tool.opacity,
              lineCap: 'round' as const,
              lineJoin: 'round' as const,
              tension: 0.5,
              globalCompositeOperation: stroke.tool.tool === 'eraser' ? 'destination-out' as const : 'source-over' as const,
            }

            if (stroke.tool.tool === 'pen' || stroke.tool.tool === 'eraser') {
              return <Line key={stroke.id} {...base} points={stroke.points} />
            }

            if (stroke.points.length < 4) return null
            const [x1, y1, x2, y2] = stroke.points
            const cx = (x1 + x2) / 2
            const cy = (y1 + y2) / 2

            switch (stroke.tool.tool) {
              case 'rectangle':
                return (
                  <Rect
                    key={stroke.id}
                    x={Math.min(x1, x2)}
                    y={Math.min(y1, y2)}
                    width={Math.abs(x2 - x1)}
                    height={Math.abs(y2 - y1)}
                    {...base}
                    fill="transparent"
                  />
                )
              case 'circle':
                return (
                  <Ellipse
                    key={stroke.id}
                    x={cx}
                    y={cy}
                    radiusX={Math.abs(x2 - x1) / 2}
                    radiusY={Math.abs(y2 - y1) / 2}
                    {...base}
                    fill="transparent"
                  />
                )
              case 'line':
                return <Line key={stroke.id} points={[x1, y1, x2, y2]} {...base} />
              default:
                return null
            }
          })}
        </Layer>
        {cursor && cursor.visible && (
          <Layer>
            <Circle
              x={cursor.x}
              y={cursor.y}
              radius={(cursor.tool.strokeWidth * stageScale) / 2 + 4}
              stroke={cursor.tool.tool === 'eraser' ? '#ffffff' : cursor.tool.color}
              strokeWidth={1.5}
              opacity={0.6}
              listening={false}
            />
            <Circle
              x={cursor.x}
              y={cursor.y}
              radius={3}
              fill={cursor.tool.tool === 'eraser' ? '#ffffff' : cursor.tool.color}
              opacity={0.8}
              listening={false}
            />
          </Layer>
        )}
      </Stage>

      <div className="pointer-events-none fixed bottom-20 left-4 z-50 flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white/80 px-2.5 py-1 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <span className="text-[11px] font-medium tabular-nums text-zinc-500">
          {Math.round(stageScale * 100)}%
        </span>
      </div>

      <button
        onClick={resetView}
        className="fixed bottom-20 left-16 z-50 cursor-pointer rounded-lg border border-zinc-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-zinc-500 shadow-sm backdrop-blur-md transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
      >
        Reset View
      </button>
    </div>
  )
})

CanvasStage.displayName = 'CanvasStage'
