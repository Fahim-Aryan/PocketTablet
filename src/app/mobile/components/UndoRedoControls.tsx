import { Undo2, Redo2, Trash2 } from 'lucide-react'

interface UndoRedoControlsProps {
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
}

export function UndoRedoControls({ onUndo, onRedo, onClear }: UndoRedoControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onUndo}
        className="cursor-pointer rounded-lg p-2 text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-200"
        aria-label="Undo"
      >
        <Undo2 className="h-5 w-5" />
      </button>
      <button
        onClick={onRedo}
        className="cursor-pointer rounded-lg p-2 text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-200"
        aria-label="Redo"
      >
        <Redo2 className="h-5 w-5" />
      </button>
      <div className="mx-1 h-5 w-px bg-zinc-700" />
      <button
        onClick={onClear}
        className="cursor-pointer rounded-lg p-2 text-zinc-400 transition-colors duration-150 hover:bg-red-500/20 hover:text-red-400"
        aria-label="Clear canvas"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  )
}
