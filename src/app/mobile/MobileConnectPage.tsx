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

export function MobileConnectPage() {
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('room') ?? ''
  const token = searchParams.get('token') ?? ''
  const [deviceId] = useState(() => nanoid())
  const [tool, setTool] = useState<ToolState>(DEFAULT_TOOL_STATE)
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [showClearModal, setShowClearModal] = useState(false)
  const [strokeId, setStrokeId] = useState('')

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

  const handleStrokeStart = useCallback((point: StrokePoint, currentTool: ToolState) => {
    const id = crypto.randomUUID()
    setStrokeId(id)
    send({ type: 'stroke:start', strokeId: id, tool: currentTool, point })
  }, [send])

  const handleStrokeMove = useCallback((points: StrokePoint[]) => {
    if (!strokeId) return
    send({ type: 'stroke:move', strokeId, points })
  }, [send, strokeId])

  const handleStrokeEnd = useCallback(() => {
    if (!strokeId) return
    send({ type: 'stroke:end', strokeId })
    setStrokeId('')
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
    send({ type: 'canvas:clear' })
    setShowClearModal(false)
  }, [send])

  useEffect(() => {
    if (!roomId || !token) {
      setStatus('disconnected')
    }
  }, [roomId, token])

  if (!roomId || !token) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-zinc-950 p-8">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-bold text-white">Invalid Link</h1>
          <p className="text-sm text-zinc-400">
            This connection link is invalid or missing parameters. Please scan the QR code again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-zinc-950">
      <TabletSurface
        tool={tool}
        onStrokeStart={handleStrokeStart}
        onStrokeMove={handleStrokeMove}
        onStrokeEnd={handleStrokeEnd}
        enabled={status === 'connected'}
      />

      <FloatingToolbar
        tool={tool}
        onToolChange={handleToolChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
      />

      <ConnectionStatusToast status={status} />

      <ClearConfirmModal
        open={showClearModal}
        onConfirm={confirmClear}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  )
}
