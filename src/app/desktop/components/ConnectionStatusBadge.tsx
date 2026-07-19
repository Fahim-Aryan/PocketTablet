import { Wifi, WifiOff } from 'lucide-react'
import type { ConnectionStatus } from '../../../shared/types/drawing'

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus
}

const config: Record<ConnectionStatus, { dot: string; label: string; icon: React.ReactNode }> = {
  idle: { dot: 'bg-zinc-400', label: 'Initializing', icon: <WifiOff className="h-3 w-3 text-zinc-400" /> },
  waiting_for_device: { dot: 'bg-amber-400', label: 'Waiting for device', icon: <Wifi className="h-3 w-3 text-amber-400" /> },
  connected: { dot: 'bg-green-500', label: 'Connected', icon: <Wifi className="h-3 w-3 text-green-500" /> },
  reconnecting: { dot: 'bg-amber-400 animate-pulse', label: 'Reconnecting', icon: <Wifi className="h-3 w-3 text-amber-400" /> },
  disconnected: { dot: 'bg-red-500', label: 'Disconnected', icon: <WifiOff className="h-3 w-3 text-red-500" /> },
}

export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  const cfg = config[status]

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
      {cfg.icon}
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{cfg.label}</span>
    </div>
  )
}
