import { Download } from 'lucide-react'

interface ExportControlsProps {
  onExport: () => void
}

export function ExportControls({ onExport }: ExportControlsProps) {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex gap-2">
      <button
        onClick={onExport}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white/90 px-3.5 py-2.5 shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:bg-zinc-800"
        title="Export as PNG"
      >
        <Download className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Export</span>
      </button>
    </div>
  )
}
