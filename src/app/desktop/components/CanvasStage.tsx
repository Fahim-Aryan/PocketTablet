import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle, useMemo } from 'react'
import type Konva from 'konva'
import { Stage, Layer, Line, Rect, Ellipse, Circle, Text, Transformer, Arrow, RegularPolygon } from 'react-konva'
import type { Shape, ToolState, StrokePoint, SelectionState } from '../../../shared/types/drawing'
import { generateId } from '../../../shared/lib/roomToken'

const HANDLE_SIZE = 10
const ROTATION_HANDLE_OFFSET = 30

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
  handleShapeUpdate: (shape: Shape) => void
  handleShapeDelete: (shapeId: string) => void
  handleShapesDelete: (shapeIds: string[]) => void
  handleSelectionChange: (selectedIds: string[]) => void
  handleClear: () => void
  handleUndo: () => void
  handleRedo: () => void
  handleExport: () => string | undefined
  setCursor: (point: StrokePoint, tool: ToolState) => void
  hideCursor: () => void
  setTool: (tool: ToolState) => void
  zoomToFit: () => void
  resetView: () => void
}

function createShapeFromStroke(strokeId: string, tool: ToolState, points: number[]): Shape {
  const shapeType = tool.tool === 'arrow' || tool.tool === 'pen' ? 'line' : tool.tool
  return {
    id: strokeId,
    type: shapeType as Shape['type'],
    tool: { ...tool },
    points: [...points],
    isActive: false,
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  }
}

function getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
  const points = shape.points
  if (points.length < 2) return { x: 0, y: 0, width: 0, height: 0 }

  let minX = points[0]
  let maxX = points[0]
  let minY = points[1]
  let maxY = points[1]

  for (let i = 2; i < points.length; i += 2) {
    minX = Math.min(minX, points[i])
    maxX = Math.max(maxX, points[i])
    minY = Math.min(minY, points[i + 1])
    maxY = Math.max(maxY, points[i + 1])
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

const stageHandleRef = useRef<CanvasStageHandle | null>(null)

export const CanvasStage = forwardRef<CanvasStageHandle>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [shapes, setShapes] = useState<Shape[]>([])
  const [history, setHistory] = useState<Shape[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [stageScale, setStageScale] = useState(1)
  const [stageX, setStageX] = useState(0)
  const [stageY, setStageY] = useState(0)
  const [cursor, setCursor] = useState<CursorState | null>(null)
  const [selection, setSelection] = useState<SelectionState>({ selectedIds: [], isSelecting: false })
  const [currentTool, setCurrentTool] = useState<ToolState>({ tool: 'pen', color: '#FFFFFF', strokeWidth: 4, opacity: 1 })
  const [showGrid, setShowGrid] = useState(true)
  const isPanning = useRef(false)
  const isDrawing = useRef(false)
  const currentStrokeId = useRef<string>('')
  const selectionStart = useRef<{ x: number; y: number } | null>(null)
  const lastClickTime = useRef(0)
  const lastClickShapeId = useRef<string | null>(null)

  useEffect(() => {
    const onResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const pushHistory = useCallback((newShapes: Shape[]) => {
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1)
      next.push(newShapes.map(s => ({ ...s })))
      return next
    })
    setHistoryIndex((i) => i + 1)
  }, [historyIndex])

  const normalizeToCanvas = useCallback((_: StrokePoint) => {
    const stage = stageRef.current
    if (!stage) return { x: 0, y: 0 }
    const pointer = stage.getPointerPosition()
    if (!pointer) return { x: 0, y: 0 }
    return {
      x: (pointer.x - stageX) / stageScale,
      y: (pointer.y - stageY) / stageScale,
    }
  }, [stageScale, stageX, stageY])

  const handleApi = useMemo(() => ({
    handleStrokeStart(point: StrokePoint, tool: ToolState, strokeId: string) {
      const pos = normalizeToCanvas(point)
      currentStrokeId.current = strokeId
      isDrawing.current = true
      const shape = createShapeFromStroke(strokeId, tool, [pos.x, pos.y])
      setShapes((prev) => [...prev, shape])
      pushHistory([...shapes, shape])
      setCursor({ x: pos.x, y: pos.y, visible: true, tool })
    },
    handleStrokeMove(points: StrokePoint[], strokeId: string) {
      if (!isDrawing.current || currentStrokeId.current !== strokeId) return
      const canvasPoints = points.map(normalizeToCanvas)
      const last = canvasPoints[canvasPoints.length - 1]
      if (last) setCursor((prev) => prev ? { ...prev, x: last.x, y: last.y } : null)
      setShapes((prev) =>
        prev.map((s) =>
          s.id === strokeId && s.isActive
            ? { ...s, points: [...s.points, ...canvasPoints.flatMap(p => [p.x, p.y])] }
            : s
        )
      )
    },
    handleStrokeEnd(_strokeId: string) {
      if (!isDrawing.current) return
      isDrawing.current = false
      setShapes((prev) =>
        prev.map((s) => (s.id === currentStrokeId.current ? { ...s, isActive: false } : s))
      )
      setCursor((prev) => prev ? { ...prev, visible: false } : null)
    },
    handleShapeUpdate(shape: Shape) {
      setShapes((prev) => {
        const idx = prev.findIndex(s => s.id === shape.id)
        if (idx === -1) return [...prev, shape]
        const next = [...prev]
        next[idx] = shape
        pushHistory(next)
        return next
      })
    },
    handleShapeDelete(shapeId: string) {
      setShapes((prev) => {
        const next = prev.filter(s => s.id !== shapeId)
        pushHistory(next)
        return next
      })
      setSelection((prev) => ({ ...prev, selectedIds: prev.selectedIds.filter(id => id !== shapeId) }))
    },
    handleShapesDelete(shapeIds: string[]) {
      setShapes((prev) => {
        const next = prev.filter(s => !shapeIds.includes(s.id))
        pushHistory(next)
        return next
      })
      setSelection((prev) => ({ ...prev, selectedIds: prev.selectedIds.filter(id => !shapeIds.includes(id)) }))
    },
    handleSelectionChange(selectedIds: string[]) {
      setSelection((prev) => ({ ...prev, selectedIds }))
    },
    handleClear() {
      setShapes([])
      setSelection({ selectedIds: [], isSelecting: false })
      setCursor(null)
      pushHistory([])
    },
    handleUndo() {
      if (historyIndex > 0) {
        const prev = history[historyIndex - 1]
        setShapes(prev.map(s => ({ ...s })))
        setHistoryIndex(historyIndex - 1)
        setSelection({ selectedIds: [], isSelecting: false })
      }
    },
    handleRedo() {
      if (historyIndex < history.length - 1) {
        const next = history[historyIndex + 1]
        setShapes(next.map(s => ({ ...s })))
        setHistoryIndex(historyIndex + 1)
        setSelection({ selectedIds: [], isSelecting: false })
      }
    },
    handleExport() {
      return stageRef.current?.toDataURL({ pixelRatio: 2 })
    },
    setCursor(point: StrokePoint, tool: ToolState) {
      const pos = normalizeToCanvas(point)
      setCursor({ x: pos.x, y: pos.y, visible: true, tool })
    },
    hideCursor() {
      setCursor((prev) => prev ? { ...prev, visible: false } : null)
    },
    setTool(tool: ToolState) {
      setCurrentTool(tool)
      if (tool.tool === 'select') {
        setSelection({ selectedIds: [], isSelecting: false })
      }
    },
    zoomToFit() {
      if (shapes.length === 0) return
      const stage = stageRef.current
      if (!stage) return
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      shapes.forEach(s => {
        const b = getShapeBounds(s)
        minX = Math.min(minX, b.x)
        minY = Math.min(minY, b.y)
        maxX = Math.max(maxX, b.x + b.width)
        maxY = Math.max(maxY, b.y + b.height)
      })
      const width = maxX - minX
      const height = maxY - minY
      const scale = Math.min(dimensions.width / width, dimensions.height / height) * 0.9
      const cx = minX + width / 2
      const cy = minY + height / 2
      setStageScale(Math.max(0.1, Math.min(10, scale)))
      setStageX(dimensions.width / 2 - cx * scale)
      setStageY(dimensions.height / 2 - cy * scale)
    },
    resetView() {
      setStageScale(1)
      setStageX(0)
      setStageY(0)
    },
  }), [normalizeToCanvas, shapes, history, historyIndex, pushHistory, dimensions])

  useImperativeHandle(ref, () => handleApi, [handleApi])
  useEffect(() => { stageHandleRef.current = handleApi }, [handleApi])

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    if (e.evt.ctrlKey || e.evt.metaKey) {
      e.evt.preventDefault()
      const scaleBy = 1.08
      const stage = stageRef.current
      if (!stage) return
      const pointer = stage.getPointerPosition()
      if (!pointer) return
      const oldScale = stage.scaleX()
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
      const mousePointTo = { x: (pointer.x - stageX) / oldScale, y: (pointer.y - stageY) / oldScale }
      setStageScale(Math.max(0.1, Math.min(10, newScale)))
      setStageX(pointer.x - mousePointTo.x * newScale)
      setStageY(pointer.y - mousePointTo.y * newScale)
    }
  }, [stageX, stageY])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

    switch (e.key.toLowerCase()) {
      case 'v':
        setCurrentTool(t => ({ ...t, tool: 'select' }))
        break
      case 'h':
        setCurrentTool(t => ({ ...t, tool: 'hand' }))
        break
      case 'p':
        setCurrentTool(t => ({ ...t, tool: 'pen' }))
        break
      case 'e':
        setCurrentTool(t => ({ ...t, tool: 'eraser' }))
        break
      case 't':
        setCurrentTool(t => ({ ...t, tool: 'text' }))
        break
      case 'a':
        setCurrentTool(t => ({ ...t, tool: 'arrow' }))
        break
      case 'r':
        setCurrentTool(t => ({ ...t, tool: 'rectangle' }))
        break
      case 'c':
        setCurrentTool(t => ({ ...t, tool: 'circle' }))
        break
      case 'd':
        setCurrentTool(t => ({ ...t, tool: 'diamond' }))
        break
      case 'l':
        setCurrentTool(t => ({ ...t, tool: 'line' }))
        break
      case 'delete':
      case 'backspace':
        if (selection.selectedIds.length > 0) {
          setShapes(prev => {
            const next = prev.filter(s => !selection.selectedIds.includes(s.id))
            pushHistory(next)
            return next
          })
          setSelection({ selectedIds: [], isSelecting: false })
        }
        break
      case 'g':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
        }
        break
      case '1':
        if (e.shiftKey) {
          e.preventDefault()
          handleApi.zoomToFit()
        }
        break
      case '2':
        if (e.shiftKey) {
          e.preventDefault()
          handleApi.resetView()
        }
        break
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          if (e.shiftKey) handleApi.handleRedo()
          else handleApi.handleUndo()
        }
        break
      case 'y':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handleApi.handleRedo()
        }
        break
      case 'd':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          if (selection.selectedIds.length > 0) {
            const selected = shapes.filter(s => selection.selectedIds.includes(s.id))
            const duplicates = selected.map(s => ({
              ...s,
              id: generateId(),
              x: (s.x || 0) + 20,
              y: (s.y || 0) + 20,
            }))
            setShapes(prev => {
              const next = [...prev, ...duplicates]
              pushHistory(next)
              return next
            })
            setSelection({ selectedIds: duplicates.map(d => d.id), isSelecting: false })
          }
        }
        break
    }
  }, [selection.selectedIds, shapes, pushHistory, handleApi])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const now = Date.now()
    const target = e.target
    const stage = stageRef.current
    if (!stage) return

    const isShape = target !== stage && target.getClassName() !== 'Stage'
    const shapeId = isShape ? (target as Konva.Node).getAttr('data-shape-id') as string | null : null

    if (currentTool.tool === 'hand' || (e.evt.button === 1) || (e.evt.shiftKey && currentTool.tool !== 'select')) {
      isPanning.current = true
      stage.container().style.cursor = 'grabbing'
      return
    }

    if (currentTool.tool === 'select') {
      if (isShape && shapeId) {
        const isSelected = selection.selectedIds.includes(shapeId)
        if (e.evt.shiftKey) {
          setSelection(prev => ({
            ...prev,
            selectedIds: isSelected
              ? prev.selectedIds.filter(id => id !== shapeId)
              : [...prev.selectedIds, shapeId]
          }))
        } else if (!isSelected) {
          setSelection({ selectedIds: [shapeId], isSelecting: false })
        }
        if (now - lastClickTime.current < 300 && lastClickShapeId.current === shapeId) {
        }
        lastClickTime.current = now
        lastClickShapeId.current = shapeId
      } else {
        if (!e.evt.shiftKey) {
          setSelection({ selectedIds: [], isSelecting: true })
          const pos = stage.getPointerPosition()
          if (pos) selectionStart.current = { x: (pos.x - stageX) / stageScale, y: (pos.y - stageY) / stageScale }
        }
      }
      return
    }

    if (['pen', 'eraser', 'line', 'arrow', 'rectangle', 'circle', 'diamond'].includes(currentTool.tool)) {
      const pos = stage.getPointerPosition()
      if (!pos) return
      const point: StrokePoint = {
        x: (pos.x - stageX) / stageScale / dimensions.width,
        y: (pos.y - stageY) / stageScale / dimensions.height,
        pressure: 0.5,
        timestamp: performance.now(),
      }
      const strokeId = generateId()
      currentStrokeId.current = strokeId
      isDrawing.current = true
      const canvasPoint = { x: (pos.x - stageX) / stageScale, y: (pos.y - stageY) / stageScale }
      const shape = createShapeFromStroke(strokeId, currentTool, [canvasPoint.x, canvasPoint.y])
      setShapes(prev => [...prev, shape])
      pushHistory([...shapes, shape])
      setCursor({ x: point.x, y: point.y, visible: true, tool: currentTool })
    }

    if (currentTool.tool === 'text') {
      const pos = stage.getPointerPosition()
      if (!pos) return
      const shape: Shape = {
        id: generateId(),
        type: 'text',
        tool: { ...currentTool, fontSize: currentTool.fontSize || 24 },
        points: [(pos.x - stageX) / stageScale, (pos.y - stageY) / stageScale],
        isActive: false,
        text: '',
        x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1,
      }
      setShapes(prev => [...prev, shape])
      pushHistory([...shapes, shape])
      setSelection({ selectedIds: [shape.id], isSelecting: false })
    }
  }, [currentTool, selection, stageScale, stageX, stageY, dimensions, shapes, pushHistory])

  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current
    if (!stage) return

    if (isPanning.current) {
      const pointer = stage.getPointerPosition()
      if (!pointer) return
      const rect = stage.container().getBoundingClientRect()
      setStageX(prev => prev + (pointer.x - (e.evt.clientX - rect.left)))
      setStageY(prev => prev + (pointer.y - (e.evt.clientY - rect.top)))
      return
    }

    if (currentTool.tool === 'select' && selection.isSelecting && selectionStart.current) {
      const pos = stage.getPointerPosition()
      if (!pos) return
      setSelection(prev => ({
        ...prev,
        selectionRect: {
          x1: selectionStart.current!.x,
          y1: selectionStart.current!.y,
          x2: (pos.x - stageX) / stageScale,
          y2: (pos.y - stageY) / stageScale,
        }
      }))
      return
    }

    if (isDrawing.current) {
      const pos = stage.getPointerPosition()
      if (!pos) return
      const point: StrokePoint = {
        x: (pos.x - stageX) / stageScale / dimensions.width,
        y: (pos.y - stageY) / stageScale / dimensions.height,
        pressure: 0.5,
        timestamp: performance.now(),
      }
      const canvasPoint = { x: (pos.x - stageX) / stageScale, y: (pos.y - stageY) / stageScale }
      setShapes(prev =>
        prev.map(s =>
          s.id === currentStrokeId.current && s.isActive
            ? { ...s, points: [...s.points, canvasPoint.x, canvasPoint.y] }
            : s
        )
      )
      setCursor((prev) => prev ? { ...prev, x: point.x, y: point.y } : null)
    }
  }, [currentTool, selection, stageScale, stageX, stageY, dimensions])

  const handleStageMouseUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false
      const stage = stageRef.current
      if (stage) stage.container().style.cursor = 'grab'
    }

    if (currentTool.tool === 'select' && selection.isSelecting && selectionStart.current) {
      const stage = stageRef.current
      if (!stage) return
      const rect = selection.selectionRect
      if (!rect) return
      const x1 = Math.min(rect.x1, rect.x2)
      const y1 = Math.min(rect.y1, rect.y2)
      const x2 = Math.max(rect.x1, rect.x2)
      const y2 = Math.max(rect.y1, rect.y2)
      const selected = shapes.filter(s => {
        const b = getShapeBounds(s)
        return b.x >= x1 && b.y >= y1 && b.x + b.width <= x2 && b.y + b.height <= y2
      })
      setSelection({ selectedIds: selected.map(s => s.id), isSelecting: false, selectionRect: undefined })
      selectionStart.current = null
    }

    if (isDrawing.current) {
      isDrawing.current = false
      setShapes(prev =>
        prev.map(s => s.id === currentStrokeId.current ? { ...s, isActive: false } : s)
      )
      setCursor(prev => prev ? { ...prev, visible: false } : null)
    }
  }, [currentTool, selection, shapes])

  const handleContextMenu = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault()
    const target = e.target
    const stage = stageRef.current
    if (!stage) return

    if (target === stage || target.getClassName() === 'Stage') return

    const shapeId = (target as Konva.Node).getAttr('data-shape-id') as string | null
    if (shapeId && !selection.selectedIds.includes(shapeId)) {
      setSelection({ selectedIds: [shapeId], isSelecting: false })
    }
  }, [selection.selectedIds])

  const handleTransformerChange = useCallback((_e: Konva.KonvaEventObject<Event>) => {
    const transformer = transformerRef.current
    if (!transformer) return
    const nodes = transformer.nodes()
    if (nodes.length === 0) return

    setShapes(prev => {
      const next = prev.map(s => {
        const node = nodes.find(n => (n as Konva.Node).getAttr('data-shape-id') === s.id)
        if (!node) return s
        return {
          ...s,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
        }
      })
      pushHistory(next)
      return next
    })
  }, [pushHistory])

  const selectedShapes = useMemo(() => shapes.filter(s => selection.selectedIds.includes(s.id)), [shapes, selection.selectedIds])

  const renderShape = useCallback((shape: Shape) => {
    const baseProps = {
      stroke: shape.tool.tool === 'eraser' ? '#ffffff' : shape.tool.color,
      strokeWidth: Math.max(1, shape.tool.strokeWidth),
      opacity: shape.tool.opacity,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
      globalCompositeOperation: shape.tool.tool === 'eraser' ? 'destination-out' as const : 'source-over' as const,
    }

    const points = shape.points
    const bounds = getShapeBounds(shape)
    const cx = bounds.x + bounds.width / 2
    const cy = bounds.y + bounds.height / 2

    const tx = (shape.x || 0) + cx
    const ty = (shape.y || 0) + cy
    const rotation = shape.rotation || 0
    const scaleX = shape.scaleX || 1
    const scaleY = shape.scaleY || 1

    const isEraser = shape.tool.tool === 'eraser'

    switch (shape.type) {
      case 'line': {
        if (points.length < 4) return null
        const isPen = shape.tool.tool === 'pen'
        return (
          <Line
            key={shape.id}
            points={points}
            {...baseProps}
            tension={isPen ? 0.5 : 0}
            x={tx}
            y={ty}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            offsetX={cx}
            offsetY={cy}
            data-shape-id={shape.id}
          />
        )
      }
      case 'arrow':
        if (points.length < 4) return null
        return (
          <Arrow
            key={shape.id}
            points={points}
            {...baseProps}
            pointerLength={15}
            pointerWidth={12}
            x={tx}
            y={ty}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            offsetX={cx}
            offsetY={cy}
            data-shape-id={shape.id}
          />
        )
      case 'rectangle':
        if (points.length < 4) return null
        return (
          <Rect
            key={shape.id}
            x={tx}
            y={ty}
            width={Math.abs(points[2] - points[0]) * scaleX}
            height={Math.abs(points[3] - points[1]) * scaleY}
            {...baseProps}
            fill={isEraser ? undefined : 'transparent'}
            rotation={rotation}
            offsetX={cx}
            offsetY={cy}
            data-shape-id={shape.id}
          />
        )
      case 'circle':
        if (points.length < 4) return null
        return (
          <Ellipse
            key={shape.id}
            x={tx}
            y={ty}
            radiusX={Math.abs(points[2] - points[0]) / 2 * scaleX}
            radiusY={Math.abs(points[3] - points[1]) / 2 * scaleY}
            {...baseProps}
            fill={isEraser ? undefined : 'transparent'}
            rotation={rotation}
            data-shape-id={shape.id}
          />
        )
      case 'diamond':
        if (points.length < 4) return null
        return (
          <RegularPolygon
            key={shape.id}
            x={tx}
            y={ty}
            sides={4}
            radius={Math.max(Math.abs(points[2] - points[0]), Math.abs(points[3] - points[1])) / 2 * Math.max(scaleX, scaleY)}
            rotation={45 + rotation}
            {...baseProps}
            fill={isEraser ? undefined : 'transparent'}
            data-shape-id={shape.id}
          />
        )
      case 'text':
        return (
          <Text
            key={shape.id}
            x={(points[0] || 0) + (shape.x || 0)}
            y={(points[1] || 0) + (shape.y || 0)}
            text={shape.text || ''}
            fontSize={(shape.tool.fontSize || 24) * scaleX}
            fontFamily={shape.tool.fontFamily || 'Inter, system-ui, sans-serif'}
            fill={shape.tool.color}
            opacity={shape.tool.opacity}
            rotation={rotation}
            data-shape-id={shape.id}
          />
        )
      default:
        return null
    }
  }, [])

  const selectionBox = selection.isSelecting && selection.selectionRect ? (
    <Rect
      x={Math.min(selection.selectionRect.x1, selection.selectionRect.x2)}
      y={Math.min(selection.selectionRect.y1, selection.selectionRect.y2)}
      width={Math.abs(selection.selectionRect.x2 - selection.selectionRect.x1)}
      height={Math.abs(selection.selectionRect.y2 - selection.selectionRect.y1)}
      stroke="#3B82F6"
      strokeWidth={1.5 / stageScale}
      dash={[8 / stageScale, 4 / stageScale]}
      fill="rgba(59, 130, 246, 0.1)"
      listening={false}
    />
  ) : null

  const grid = showGrid ? (
    <Layer listening={false}>
      {(() => {
        const dots: { x: number; y: number }[] = []
        const spacing = 30
        const cols = Math.ceil(dimensions.width / spacing) + 2
        const rows = Math.ceil(dimensions.height / spacing) + 2
        const offX = (-stageX % spacing + spacing) % spacing
        const offY = (-stageY % spacing + spacing) % spacing
        for (let i = -1; i < cols; i++) {
          for (let j = -1; j < rows; j++) {
            dots.push({ x: i * spacing + offX, y: j * spacing + offY })
          }
        }
        return dots.map((dot, i) => (
          <Circle key={i} x={dot.x} y={dot.y} radius={0.5} fill="#E4E4E7" />
        ))
      })()}
    </Layer>
  ) : null

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
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onClick={handleStageMouseDown}
        onContextMenu={handleContextMenu}
        draggable={false}
        className={currentTool.tool === 'hand' ? 'cursor-grab' : currentTool.tool === 'select' ? 'cursor-default' : 'crosshair'}
      >
        {grid}
        <Layer>
          <Rect x={0} y={0} width={dimensions.width} height={dimensions.height} fill="#FAFAFA" listening={false} />
        </Layer>
        <Layer>
          {shapes.map(renderShape)}
          {selectionBox}
        </Layer>
        {selection.selectedIds.length > 0 && (
          <Layer>
            <Transformer
              ref={transformerRef}
              nodes={selectedShapes as unknown as Konva.Node[]}
              enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']}
              rotateEnabled={true}
              rotateAnchorOffset={ROTATION_HANDLE_OFFSET / stageScale}
              anchorSize={HANDLE_SIZE / stageScale}
              anchorStroke="#3B82F6"
              anchorFill="white"
              borderStroke="#3B82F6"
              borderStrokeWidth={1.5 / stageScale}
              borderDash={[4 / stageScale, 2 / stageScale]}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 10 || newBox.height < 10) return oldBox
                return newBox
              }}
              onTransformEnd={handleTransformerChange}
              listening={currentTool.tool === 'select'}
            />
          </Layer>
        )}
        {cursor && cursor.visible && (
          <Layer>
            <Circle
              x={cursor.x * stageScale + stageX}
              y={cursor.y * stageScale + stageY}
              radius={(cursor.tool.strokeWidth * stageScale) / 2 + 4}
              stroke={cursor.tool.tool === 'eraser' ? '#ffffff' : cursor.tool.color}
              strokeWidth={1.5}
              opacity={0.6}
              listening={false}
            />
            <Circle
              x={cursor.x * stageScale + stageX}
              y={cursor.y * stageScale + stageY}
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
        <span className="text-[11px] text-zinc-400 px-1">|</span>
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          {currentTool.tool}
        </span>
      </div>

      <button
        onClick={() => setShowGrid(!showGrid)}
        className="fixed bottom-20 left-32 z-50 cursor-pointer rounded-lg border border-zinc-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-zinc-500 shadow-sm backdrop-blur-md transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
      >
        {showGrid ? 'Hide Grid' : 'Show Grid'}
      </button>

      <button
        onClick={() => handleApi.resetView()}
        className="fixed bottom-20 left-48 z-50 cursor-pointer rounded-lg border border-zinc-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-zinc-500 shadow-sm backdrop-blur-md transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
      >
        Reset View
      </button>

      <button
        onClick={() => handleApi.zoomToFit()}
        className="fixed bottom-20 left-76 z-50 cursor-pointer rounded-lg border border-zinc-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-zinc-500 shadow-sm backdrop-blur-md transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
      >
        Zoom Fit
      </button>
    </div>
  )
})

CanvasStage.displayName = 'CanvasStage'