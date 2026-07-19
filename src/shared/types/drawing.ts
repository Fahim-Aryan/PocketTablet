export type ToolType = 'select' | 'hand' | 'pen' | 'eraser' | 'line' | 'arrow' | 'rectangle' | 'circle' | 'diamond' | 'text'

export interface ToolState {
  tool: ToolType
  color: string
  strokeWidth: number
  opacity: number
  fontSize?: number
  fontFamily?: string
}

export interface StrokePoint {
  x: number
  y: number
  pressure: number
  tiltX?: number
  tiltY?: number
  timestamp: number
}

export interface Shape {
  id: string
  type: Exclude<ToolType, 'select' | 'hand' | 'pen' | 'eraser'>
  tool: ToolState
  points: number[]
  isActive: boolean
  // For text
  text?: string
  // For transform
  x?: number
  y?: number
  rotation?: number
  scaleX?: number
  scaleY?: number
}

export type BroadcastEvent =
  | { type: 'stroke:start'; strokeId: string; tool: ToolState; point: StrokePoint }
  | { type: 'stroke:move'; strokeId: string; points: StrokePoint[] }
  | { type: 'stroke:end'; strokeId: string }
  | { type: 'tool:update'; tool: ToolState }
  | { type: 'canvas:undo' }
  | { type: 'canvas:redo' }
  | { type: 'canvas:clear' }
  | { type: 'export:request' }
  | { type: 'shape:update'; shape: Shape }
  | { type: 'shape:delete'; shapeId: string }
  | { type: 'shapes:delete'; shapeIds: string[] }
  | { type: 'selection:change'; selectedIds: string[] }

export type ConnectionStatus = 'idle' | 'waiting_for_device' | 'connected' | 'reconnecting' | 'disconnected'

export interface PresencePayload {
  role: 'desktop' | 'mobile'
  deviceId: string
  joinedAt: number
}

export interface SelectionState {
  selectedIds: string[]
  isSelecting: boolean
  selectionRect?: { x1: number; y1: number; x2: number; y2: number }
}