import type { ConnectionStatus } from '../../../shared/types/drawing'

interface ConnectionStatusToastProps {
  status: ConnectionStatus
}

const config: Record<ConnectionStatus, { dot: string; label: string; visible: boolean }> = {
  idle: { dot: 'bg-zinc-400', label: 'Connecting...', visible: true },
  waiting_for_device: { dot: 'bg-amber-400', label: 'Connecting...', visible: true },
  connected: { dot: 'bg-green-500', label: 'Connected', visible: false },
  reconnecting: { dot: 'bg-amber-400 animate-pulse', label: 'Reconnecting...', visible: true },
  disconnected: { dot: 'bg-red-500', label: 'Disconnected', visible: true },
}

export function ConnectionStatusToast({ status }: ConnectionStatusToastProps) {
  const cfg = config[status]

  return (
    <div
      className={`pointer-events-none fixed top-4 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        cfg.visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
    >
      <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-2 shadow-lg backdrop-blur-md">
        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
        <span className="text-xs font-medium text-zinc-300">{cfg.label}</span>
      </div>
    </div>
  )
}
