import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { TabletSurface } from './components/TabletSurface'
import { FloatingToolbar } from './components/FloatingToolbar'
import { ConnectionStatusToast } from './components/ConnectionStatusToast'
import { ClearConfirmModal } from './components/ClearConfirmModal'
import { useRealtimeRoom } from '../../shared/hooks/useRealtimeRoom'
import { usePresence } from '../../shared/hooks/usePresence'
import type { ToolState, StrokePoint, ConnectionStatus, BroadcastEvent } from '../../shared/types/drawing'

const DEFAULT_TOOL_STATE: ToolState = {
  tool: 'pen',
  color: '#FFFFFF',
  strokeWidth: 4,
  opacity: 1,
}

function PressureIndicator({ pressure }: { pressure: number }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-4 z-50 flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/80 px-3 py-1.5 shadow-lg backdrop-blur-md">
        <div className="h-1 w-16 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cta to-pink-400 transition-all duration-75"
            style={{ width: `${Math.min(100, Math.round(pressure * 100))}%` }}
          />
        </div>
        <span className="text-[10px] font-medium tabular-nums text-zinc-500">
          {Math.round(pressure * 100)}%
        </span>
      </div>
    </div>
  )
}

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
    if (!strokeId) return
    send({ type: 'stroke:end', strokeId })
    setStrokeId('')
    setPressure(0)
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

  if (!roomId || !token) {
    return (
      <div className="flex h-dvh w-dvw flex-col items-center justify-center gap-4 bg-zinc-950 p-8">
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
    <div className="relative h-dvh w-dvw overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 flex flex-col">
        <div className="relative flex-1">
          <TabletSurface
            tool={tool}
            onStrokeStart={handleStrokeStart}
            onStrokeMove={handleStrokeMove}
            onStrokeEnd={handleStrokeEnd}
            enabled={true}
            pressure={pressure}
          />
        </div>
      </div>

      <FloatingToolbar
        tool={tool}
        onToolChange={handleToolChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
      />

      <ConnectionStatusToast status={status} />

      <PressureIndicator pressure={pressure} />

      <ClearConfirmModal
        open={showClearModal}
        onConfirm={confirmClear}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  )
}
