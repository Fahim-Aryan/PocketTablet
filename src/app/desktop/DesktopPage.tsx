import { useState, useCallback, useRef } from 'react'
import { nanoid } from 'nanoid'
import { CanvasStage, type CanvasStageHandle } from './components/CanvasStage'
import { QRPairingPanel } from './components/QRPairingPanel'
import { ConnectionStatusBadge } from './components/ConnectionStatusBadge'
import { ExportControls } from './components/ExportControls'
import { ToolbarMirror } from './components/ToolbarMirror'
import { SetupGuide } from '../../shared/components/SetupGuide'
import { useRealtimeRoom } from '../../shared/hooks/useRealtimeRoom'
import { usePresence } from '../../shared/hooks/usePresence'
import { generateRoomId, generatePairingToken, buildConnectUrl } from '../../shared/lib/roomToken'
import { getBaseUrl } from '../../shared/utils/qrCodeUrl'
import { isSupabaseConfigured } from '../../shared/lib/supabaseClient'
import type { BroadcastEvent, ConnectionStatus, ToolState } from '../../shared/types/drawing'

export function DesktopPage() {
  const [roomId] = useState(() => generateRoomId())
  const [pairingToken] = useState(() => generatePairingToken())
  const [deviceId] = useState(() => nanoid())
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [activeTool, setActiveTool] = useState<ToolState | null>(null)
  const canvasRef = useRef<CanvasStageHandle>(null)

  const baseUrl = getBaseUrl()
  const qrUrl = buildConnectUrl(baseUrl, roomId, pairingToken)
  const roomCode = roomId.slice(0, 6).toUpperCase()

  const handleEvent = useCallback((event: BroadcastEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    switch (event.type) {
      case 'stroke:start':
        canvas.handleStrokeStart(event.point, event.tool, event.strokeId)
        break
      case 'stroke:move':
        canvas.handleStrokeMove(event.points, event.strokeId)
        break
      case 'stroke:end':
        canvas.handleStrokeEnd(event.strokeId)
        break
      case 'tool:update':
        setActiveTool(event.tool)
        break
      case 'canvas:clear':
        canvas.handleClear()
        break
      case 'canvas:undo':
        canvas.handleUndo()
        break
      case 'export:request':
        const dataUrl = canvas.handleExport()
        if (dataUrl) {
          const link = document.createElement('a')
          link.download = `pockettablet-${Date.now()}.png`
          link.href = dataUrl
          link.click()
        }
        break
    }
  }, [])

  useRealtimeRoom({ roomId, onEvent: handleEvent })

  usePresence({
    roomId,
    role: 'desktop',
    deviceId,
    onStatusChange: setStatus,
  })

  const [regenerateKey, setRegenerateKey] = useState(0)

  const handleRegenerate = useCallback(() => {
    setRegenerateKey((k) => k + 1)
  }, [])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <CanvasStage key={regenerateKey} ref={canvasRef} />

      <QRPairingPanel
        qrUrl={qrUrl}
        roomCode={roomCode}
        status={status}
        onRegenerate={handleRegenerate}
      />

      <ToolbarMirror tool={activeTool} />

      <ExportControls onExport={() => {
        const dataUrl = canvasRef.current?.handleExport()
        if (dataUrl) {
          const link = document.createElement('a')
          link.download = `pockettablet-${Date.now()}.png`
          link.href = dataUrl
          link.click()
        }
      }} />

      <ConnectionStatusBadge status={status} />

      {!isSupabaseConfigured && <SetupGuide />}
    </div>
  )
}
