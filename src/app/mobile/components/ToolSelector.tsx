import { Pen, Eraser, Minus, Square, Circle } from 'lucide-react'
import type { ToolType } from '../../../shared/types/drawing'

interface ToolSelectorProps {
  activeTool: ToolType
  onSelect: (tool: ToolType) => void
}

const tools: { type: ToolType; icon: React.ReactNode; label: string }[] = [
  { type: 'pen', icon: <Pen className="h-4 w-4" />, label: 'Pen' },
  { type: 'eraser', icon: <Eraser className="h-4 w-4" />, label: 'Eraser' },
  { type: 'line', icon: <Minus className="h-4 w-4" />, label: 'Line' },
  { type: 'rectangle', icon: <Square className="h-4 w-4" />, label: 'Rect' },
  { type: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Circle' },
]

export function ToolSelector({ activeTool, onSelect }: ToolSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl bg-zinc-800/50 p-1">
      {tools.map(({ type, icon, label }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150 ${
            activeTool === type
              ? 'bg-cta text-white shadow-sm'
              : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
          }`}
          aria-label={label}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
