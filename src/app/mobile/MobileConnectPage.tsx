import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { TabletSurface } from './components/TabletSurface'
import { ConnectionStatusToast } from './components/ConnectionStatusToast'
import { ClearConfirmModal } from './components/ClearConfirmModal'
import { LandscapeHint } from '../../shared/components/LandscapeHint'
import { useRealtimeRoom } from '../../shared/hooks/useRealtimeRoom'
import { usePresence } from '../../shared/hooks/usePresence'
import { Undo2, Redo2, RotateCcw, Eraser, Pen, Minus, Square, Circle } from 'lucide-react'
import type { ToolState, StrokePoint, ConnectionStatus, BroadcastEvent, ToolType } from '../../shared/types/drawing'

const DEFAULT_TOOL_STATE: ToolState = {
  tool: 'pen',
  color: '#FFFFFF',
  strokeWidth: 4,
  opacity: 1,
}

function PressureIndicator({ pressure }: { pressure: number }) {
  return (
    <div className="pointer-events-none fixed bottom-20 right-2 z-50 flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/80 px-2.5 py-1 shadow-lg backdrop-blur-md">
        <div className="h-1 w-12 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cta to-pink-400 transition-all duration-75"
            style={{ width: `${Math.min(100, Math.round(pressure * 100))}%` }}
          />
        </div>
        <span className="text-[9px] font-medium tabular-nums text-zinc-500">
          {Math.round(pressure * 100)}%
        </span>
      </div>
    </div>
  )
}

const TOOLS: { type: ToolType; icon: React.ReactNode }[] = [
  { type: 'pen', icon: <Pen className="h-4 w-4" /> },
  { type: 'eraser', icon: <Eraser className="h-4 w-4" /> },
  { type: 'line', icon: <Minus className="h-4 w-4" /> },
  { type: 'rectangle', icon: <Square className="h-4 w-4" /> },
  { type: 'circle', icon: <Circle className="h-4 w-4" /> },
]

export function MobileConnectPage() {
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('room') ?? ''
  const token = searchParams.get('token') ?? ''
  const [deviceId] = useState(() => nanoid())
  const [tool, setTool] = useState<ToolState>(DEFAULT_TOOL_STATE)
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [showClearModal, setShowClearModal] = useState(false)
  const [strokeId, setStrokeId] = useState('')
  const [pressure, setPressure] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leftBtnRef = useRef<HTMLButtonElement>(null)

  const handleEvent = useCallback((_event: BroadcastEvent) => {
  }, [])

  const { send } = useRealtimeRoom({
    roomId,
    onEvent: handleEvent,
    enabled: !!roomId && !!token,
  })

  usePresence({
    roomId,
    role: 'mobile',
    deviceId,
    onStatusChange: setStatus,
  })

  const handleToolChange = useCallback((partial: Partial<ToolState>) => {
    setTool((prev) => {
      const next = { ...prev, ...partial }
      send({ type: 'tool:update', tool: next })
      return next
    })
  }, [send])

  const clearCanvas = useCallback(() => {
    send({ type: 'canvas:clear' })
  }, [send])

  const handleStrokeStart = useCallback((point: StrokePoint, currentTool: ToolState) => {
    const id = crypto.randomUUID()
    setStrokeId(id)
    setPressure(point.pressure)
    send({ type: 'stroke:start', strokeId: id, tool: currentTool, point })
  }, [send])

  const handleStrokeMove = useCallback((points: StrokePoint[]) => {
    if (!strokeId && points.length > 0) return
    const lastPoint = points[points.length - 1]
    if (lastPoint) setPressure(lastPoint.pressure)
    send({ type: 'stroke:move', strokeId, points })
  }, [send, strokeId])

  const handleStrokeEnd = useCallback(() => {
    const id = strokeId
    setStrokeId('')
    setPressure(0)
    if (!id) return
    send({ type: 'stroke:end', strokeId: id })
  }, [send, strokeId])

  const handleUndo = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(10)
    send({ type: 'canvas:undo' })
  }, [send])

  const handleRedo = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(10)
    send({ type: 'canvas:redo' })
  }, [send])

  const handleClear = useCallback(() => {
    setShowClearModal(true)
  }, [])

  const confirmClear = useCallback(() => {
    clearCanvas()
    setShowClearModal(false)
  }, [clearCanvas])

  useEffect(() => {
    if (!roomId || !token) {
      setStatus('disconnected')
    }
  }, [roomId, token])

  const handleLeftBtnPointerDown = useCallback(() => {
    setIsDrawing(true)
    if (navigator.vibrate) navigator.vibrate(8)
    longPressRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(15)
    }, 300)
  }, [])

  const handleLeftBtnPointerUp = useCallback(() => {
    setIsDrawing(false)
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
  }, [])

  const handleRightBtnClick = useCallback(() => {
    const nextTool = tool.tool === 'eraser' ? 'pen' : 'eraser'
    handleToolChange({ tool: nextTool })
    if (navigator.vibrate) navigator.vibrate(10)
  }, [tool.tool, handleToolChange])

  if (!roomId || !token) {
    return (
      <div className="flex h-dvh w-dvh flex-col items-center justify-center gap-4 bg-zinc-950 p-8">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-bold tracking-tight text-white">PocketTablet</h1>
          <p className="text-sm text-zinc-500">
            Invalid connection. Please scan the QR code again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-dvh w-dvw flex-col overflow-hidden bg-zinc-950">
      <div className="relative flex-1">
        <TabletSurface
          tool={tool}
          onStrokeStart={handleStrokeStart}
          onStrokeMove={handleStrokeMove}
          onStrokeEnd={handleStrokeEnd}
          enabled={true}
          canDraw={isDrawing}
          pressure={pressure}
        />
      </div>

      <div className="z-30 flex items-center gap-2 border-t border-zinc-800 bg-zinc-900 px-2 py-1.5">
        <button
          ref={leftBtnRef}
          onPointerDown={handleLeftBtnPointerDown}
          onPointerUp={handleLeftBtnPointerUp}
          onPointerLeave={handleLeftBtnPointerUp}
          className={`flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition-all duration-100 select-none active:scale-95 ${
            isDrawing
              ? 'bg-cta text-white shadow-lg shadow-pink-500/30'
              : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
          }`}
          style={{ touchAction: 'none' }}
        >
          <span className="text-base leading-none">●</span>
          <span className="text-[10px]">{isDrawing ? 'DRAWING' : 'DRAW' }</span>
        </button>

        <button
          onClick={handleRightBtnClick}
          className={`flex cursor-pointer items-center justify-center rounded-xl px-3 py-3 text-xs font-bold transition-all duration-100 select-none active:scale-95 ${
            tool.tool === 'eraser'
              ? 'bg-amber-600 text-white'
              : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
          }`}
          style={{ touchAction: 'none' }}
        >
          <Eraser className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-zinc-700" />

        <div className="flex items-center gap-0.5">
          {TOOLS.filter(t => t.type !== 'eraser').map(({ type, icon }) => (
            <button
              key={type}
              onClick={() => handleToolChange({ tool: type })}
              className={`cursor-pointer rounded-lg p-1.5 transition-all duration-150 ${
                tool.tool === type
                  ? 'bg-cta/20 text-cta'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={handleUndo}
            className="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            className="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleClear}
            className="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-red-400"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ConnectionStatusToast status={status} />

      <PressureIndicator pressure={pressure} />

      <ClearConfirmModal
        open={showClearModal}
        onConfirm={confirmClear}
        onCancel={() => setShowClearModal(false)}
      />

      <LandscapeHint />
    </div>
  )
}
