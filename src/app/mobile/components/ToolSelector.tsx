import { Pen, Eraser, Minus, Square, Circle } from 'lucide-react'
import type { ToolType } from '../../../shared/types/drawing'

interface ToolSelectorProps {
  activeTool: ToolType
  onSelect: (tool: ToolType) => void
}

const tools: { type: ToolType; icon: React.ReactNode; label: string }[] = [
  { type: 'pen', icon: <Pen className="h-5 w-5" />, label: 'Pen' },
  { type: 'eraser', icon: <Eraser className="h-5 w-5" />, label: 'Eraser' },
  { type: 'line', icon: <Minus className="h-5 w-5" />, label: 'Line' },
  { type: 'rectangle', icon: <Square className="h-5 w-5" />, label: 'Rectangle' },
  { type: 'circle', icon: <Circle className="h-5 w-5" />, label: 'Circle' },
]

export function ToolSelector({ activeTool, onSelect }: ToolSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {tools.map(({ type, icon, label }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`cursor-pointer rounded-lg p-2.5 transition-all duration-150 ${
            activeTool === type
              ? 'bg-cta text-white shadow-sm'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
          aria-label={label}
          title={label}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
