import { Download } from 'lucide-react'

interface ExportControlsProps {
  onExport: () => void
}

export function ExportControls({ onExport }: ExportControlsProps) {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex gap-2">
      <button
        onClick={onExport}
        className="cursor-pointer rounded-full border border-zinc-200 bg-white/80 p-2.5 shadow-sm backdrop-blur-md transition-colors duration-200 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
        title="Export as PNG"
      >
        <Download className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
      </button>
    </div>
  )
}
