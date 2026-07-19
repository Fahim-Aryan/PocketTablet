import { Undo2, Redo2, RotateCcw } from 'lucide-react'

interface UndoRedoControlsProps {
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
}

export function UndoRedoControls({ onUndo, onRedo, onClear }: UndoRedoControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-0.5">
        <button
          onClick={onUndo}
          className="cursor-pointer rounded-lg p-1.5 text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          className="cursor-pointer rounded-lg p-1.5 text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={onClear}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400"
        aria-label="Clear canvas"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Clear
      </button>
    </div>
  )
}
