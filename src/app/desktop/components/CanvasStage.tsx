import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import type Konva from 'konva'
import { Stage, Layer, Line, Rect, Ellipse } from 'react-konva'
import type { StrokePoint, ToolState } from '../../../shared/types/drawing'

interface Stroke {
  id: string
  tool: ToolState
  points: number[]
  isActive: boolean
}

export interface CanvasStageHandle {
  handleStrokeStart: (point: StrokePoint, tool: ToolState, strokeId: string) => void
  handleStrokeMove: (points: StrokePoint[], strokeId: string) => void
  handleStrokeEnd: (strokeId: string) => void
  handleClear: () => void
  handleUndo: () => void
  handleExport: () => string | undefined
}

export const CanvasStage = forwardRef<CanvasStageHandle>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [stageScale, setStageScale] = useState(1)
  const [stageX, setStageX] = useState(0)
  const [stageY, setStageY] = useState(0)
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
      setStrokes((prev) => [...prev, { id: strokeId, tool, points: [x, y], isActive: true }])
    },
    handleStrokeMove(points, strokeId) {
      const canvasPoints = points.flatMap((p) => {
        const { x, y } = normalizeToCanvas(p)
        return [x, y]
      })
      setStrokes((prev) =>
        prev.map((s) =>
          s.id === strokeId && s.isActive
            ? { ...s, points: [...s.points, ...canvasPoints] }
            : s
        )
      )
    },
    handleStrokeEnd(strokeId) {
      setStrokes((prev) =>
        prev.map((s) => (s.id === strokeId ? { ...s, isActive: false } : s))
      )
    },
    handleClear() {
      setStrokes([])
    },
    handleUndo() {
      setStrokes((prev) => prev.slice(0, -1))
    },
    handleExport() {
      return stageRef.current?.toDataURL({ pixelRatio: 2 })
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

    setStageScale(newScale)
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

  return (
    <div ref={containerRef} className="absolute inset-0 bg-white dark:bg-zinc-950">
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
          {strokes.map((stroke) => {
            const base = {
              stroke: stroke.tool.tool === 'eraser' ? '#ffffff' : stroke.tool.color,
              strokeWidth: stroke.tool.strokeWidth * (stageScale || 1),
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
      </Stage>
    </div>
  )
})

CanvasStage.displayName = 'CanvasStage'
