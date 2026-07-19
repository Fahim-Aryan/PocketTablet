import type { ConnectionStatus } from '../../../shared/types/drawing'

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus
}

const config: Record<ConnectionStatus, { dot: string; label: string }> = {
  idle: { dot: 'bg-zinc-400', label: 'Initializing' },
  waiting_for_device: { dot: 'bg-amber-400', label: 'Waiting for device' },
  connected: { dot: 'bg-green-500', label: 'Connected' },
  reconnecting: { dot: 'bg-amber-400 animate-pulse', label: 'Reconnecting' },
  disconnected: { dot: 'bg-red-500', label: 'Disconnected' },
}

export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  const cfg = config[status]

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{cfg.label}</span>
    </div>
  )
}
