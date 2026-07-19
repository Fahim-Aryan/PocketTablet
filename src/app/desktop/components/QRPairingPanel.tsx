import { QRCodeSVG } from 'qrcode.react'
import type { ConnectionStatus } from '../../../shared/types/drawing'

interface QRPairingPanelProps {
  qrUrl: string
  roomCode: string
  status: ConnectionStatus
  onRegenerate: () => void
}

const statusConfig: Record<ConnectionStatus, { color: string; label: string; dotClass: string }> = {
  idle: { color: '#71717A', label: 'Initializing...', dotClass: 'bg-gray-400' },
  waiting_for_device: { color: '#F59E0B', label: 'Scan QR to connect', dotClass: 'bg-amber-400' },
  connected: { color: '#22C55E', label: 'Connected', dotClass: 'bg-green-500' },
  reconnecting: { color: '#F59E0B', label: 'Reconnecting...', dotClass: 'bg-amber-400 animate-pulse' },
  disconnected: { color: '#EF4444', label: 'Disconnected', dotClass: 'bg-red-500' },
}

export function QRPairingPanel({ qrUrl, roomCode, status, onRegenerate }: QRPairingPanelProps) {
  const cfg = statusConfig[status]

  if (status === 'connected') return null

  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${cfg.dotClass}`} />
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{cfg.label}</span>
      </div>

      <div className="rounded-lg bg-white p-2">
        <QRCodeSVG value={qrUrl} size={180} level="M" />
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400">Or enter code</span>
        <span className="select-all rounded-md bg-zinc-100 px-3 py-1 font-mono text-sm font-bold tracking-widest text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          {roomCode}
        </span>
      </div>

      {status === 'waiting_for_device' && (
        <button
          onClick={onRegenerate}
          className="cursor-pointer rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors duration-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          Regenerate QR
        </button>
      )}
    </div>
  )
}
