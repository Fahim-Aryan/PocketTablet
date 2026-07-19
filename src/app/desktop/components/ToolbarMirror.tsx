import type { ToolState } from '../../../shared/types/drawing'
import { Pen, Eraser, Minus, Square, Circle } from 'lucide-react'

interface ToolbarMirrorProps {
  tool: ToolState | null
}

const toolIcons: Record<string, React.ReactNode> = {
  pen: <Pen className="h-3.5 w-3.5" />,
  eraser: <Eraser className="h-3.5 w-3.5" />,
  line: <Minus className="h-3.5 w-3.5" />,
  rectangle: <Square className="h-3.5 w-3.5" />,
  circle: <Circle className="h-3.5 w-3.5" />,
}

export function ToolbarMirror({ tool }: ToolbarMirrorProps) {
  if (!tool) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
      <span className="text-zinc-500 dark:text-zinc-400">
        {toolIcons[tool.tool] ?? <Pen className="h-3.5 w-3.5" />}
      </span>
      <span
        className="h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-600"
        style={{ backgroundColor: tool.color }}
      />
      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        {tool.strokeWidth}px
      </span>
    </div>
  )
}
