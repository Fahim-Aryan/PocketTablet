import { useEffect } from 'react'

interface ClearConfirmModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ClearConfirmModal({ open, onConfirm, onCancel }: ClearConfirmModalProps) {
  useEffect(() => {
    if (open && navigator.vibrate) {
      navigator.vibrate(20)
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-xs rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white">Clear canvas?</h3>
          <p className="mt-1 text-sm text-zinc-400">All strokes will be erased.</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-xl border border-zinc-700 py-2.5 text-sm font-medium text-zinc-300 transition-colors duration-150 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15)
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
