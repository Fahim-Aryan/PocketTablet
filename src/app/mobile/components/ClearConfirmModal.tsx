import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'

interface ClearConfirmModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ClearConfirmModal({ open, onConfirm, onCancel }: ClearConfirmModalProps) {
  useEffect(() => {
    if (open && navigator.vibrate) {
      navigator.vibrate(30)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-xs rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Clear canvas?</h3>
            <p className="text-sm text-zinc-400">This cannot be undone.</p>
          </div>
          <button
            onClick={onCancel}
            className="ml-auto cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-xl border border-zinc-700 py-2.5 text-sm font-medium text-zinc-300 transition-colors duration-150 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(20)
              onConfirm()
            }}
            className="flex-1 cursor-pointer rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-red-600"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
