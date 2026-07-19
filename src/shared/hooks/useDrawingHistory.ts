import { useCallback, useRef } from 'react'

interface DrawingAction {
  type: 'stroke' | 'clear'
  strokeId?: string
}

export function useDrawingHistory() {
  const undoStack = useRef<DrawingAction[]>([])
  const redoStack = useRef<DrawingAction[]>([])

  const pushAction = useCallback((action: DrawingAction) => {
    undoStack.current.push(action)
    redoStack.current = []
  }, [])

  const undo = useCallback((): DrawingAction | null => {
    const action = undoStack.current.pop()
    if (action) {
      redoStack.current.push(action)
    }
    return action ?? null
  }, [])

  const redo = useCallback((): DrawingAction | null => {
    const action = redoStack.current.pop()
    if (action) {
      undoStack.current.push(action)
    }
    return action ?? null
  }, [])

  const clear = useCallback(() => {
    undoStack.current = []
    redoStack.current = []
  }, [])

  return { pushAction, undo, redo, clear }
}
