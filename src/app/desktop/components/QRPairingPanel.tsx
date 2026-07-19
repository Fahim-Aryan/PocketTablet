import { QRCodeSVG } from 'qrcode.react'
import { Smartphone, RefreshCw } from 'lucide-react'
import type { ConnectionStatus } from '../../../shared/types/drawing'

interface QRPairingPanelProps {
  qrUrl: string
  roomCode: string
  status: ConnectionStatus
  onRegenerate: () => void
}

const statusConfig: Record<ConnectionStatus, { color: string; label: string; dotClass: string }> = {
  idle: { color: '#71717A', label: 'Initializing...', dotClass: 'bg-zinc-400' },
  waiting_for_device: { color: '#F59E0B', label: 'Scan to connect', dotClass: 'bg-amber-400' },
  connected: { color: '#22C55E', label: 'Connected', dotClass: 'bg-green-500' },
  reconnecting: { color: '#F59E0B', label: 'Reconnecting...', dotClass: 'bg-amber-400 animate-pulse' },
  disconnected: { color: '#EF4444', label: 'Disconnected', dotClass: 'bg-red-500' },
}

export function QRPairingPanel({ qrUrl, roomCode, status, onRegenerate }: QRPairingPanelProps) {
  const cfg = statusConfig[status]

  if (status === 'connected') {
    return (
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 shadow-lg backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-sm font-medium text-green-400">Device connected</span>
      </div>
    )
  }

  return (
    <div className="fixed top-4 left-4 z-50 w-[200px] rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <Smartphone className="h-3.5 w-3.5 text-zinc-500" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-zinc-500">PocketTablet</p>
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
            <span className="text-[10px] text-zinc-400">{cfg.label}</span>
          </div>
        </div>
      </div>

      <div className="mb-3 flex justify-center rounded-xl bg-white p-2">
        <QRCodeSVG value={qrUrl} size={160} level="M" />
      </div>

      <div className="mb-3 flex flex-col items-center gap-1">
        <span className="text-[9px] uppercase tracking-widest text-zinc-400">Or enter code</span>
        <span className="select-all rounded-md bg-zinc-100 px-3 py-1 font-mono text-sm font-bold tracking-widest text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          {roomCode}
        </span>
      </div>

      {status === 'waiting_for_device' && (
        <button
          onClick={onRegenerate}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-[11px] font-medium text-zinc-600 transition-colors duration-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          <RefreshCw className="h-3 w-3" />
          New QR
        </button>
      )}
    </div>
  )
}
