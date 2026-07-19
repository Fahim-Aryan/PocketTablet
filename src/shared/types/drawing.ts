export type ToolType = 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle'

export interface ToolState {
  tool: ToolType
  color: string
  strokeWidth: number
  opacity: number
}

export interface StrokePoint {
  x: number
  y: number
  pressure: number
  tiltX?: number
  tiltY?: number
  timestamp: number
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

export type ConnectionStatus = 'idle' | 'waiting_for_device' | 'connected' | 'reconnecting' | 'disconnected'

export interface PresencePayload {
  role: 'desktop' | 'mobile'
  deviceId: string
  joinedAt: number
}
