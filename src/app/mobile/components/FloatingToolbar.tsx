import { useState, useCallback, useRef } from 'react'
import { GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { ToolSelector } from './ToolSelector'
import { ColorPicker } from './ColorPicker'
import { StrokeWidthSlider } from './StrokeWidthSlider'
import { OpacitySlider } from './OpacitySlider'
import { UndoRedoControls } from './UndoRedoControls'
import type { ToolType, ToolState } from '../../../shared/types/drawing'

interface FloatingToolbarProps {
  tool: ToolState
  onToolChange: (tool: Partial<ToolState>) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
}

export function FloatingToolbar({
  tool,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
}: FloatingToolbarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [position, setPosition] = useState({ x: 16, y: 16 })
  const dragState = useRef({ dragging: false, startX: 0, startY: 0 })

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!(e.target as HTMLElement).closest('[data-drag-handle]')) return
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    dragState.current = {
      dragging: true,
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    }

    const onMove = (ev: PointerEvent) => {
      if (!dragState.current.dragging) return
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 280, ev.clientX - dragState.current.startX)),
        y: Math.max(0, Math.min(window.innerHeight - 200, ev.clientY - dragState.current.startY)),
      })
    }
    const onUp = () => {
      dragState.current.dragging = false
      el.releasePointerCapture(e.pointerId)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
  }, [position])

  return (
    <div
      className={`fixed z-50 select-none rounded-2xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl backdrop-blur-xl transition-all duration-200 ${
        collapsed ? 'w-auto' : 'w-[260px]'
      }`}
      style={{
        left: position.x,
        top: position.y,
        touchAction: 'none',
      }}
    >
      <div
        data-drag-handle
        onPointerDown={handlePointerDown}
        className="flex cursor-grab items-center justify-between border-b border-zinc-800 px-3 py-2 active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Tools
          </span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="cursor-pointer rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          aria-label={collapsed ? 'Expand toolbar' : 'Collapse toolbar'}
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-3 p-3">
          <ToolSelector
            activeTool={tool.tool}
            onSelect={(t: ToolType) => onToolChange({ tool: t })}
          />

          <ColorPicker
            color={tool.color}
            onChange={(color) => onToolChange({ color })}
          />

          <StrokeWidthSlider
            value={tool.strokeWidth}
            onChange={(strokeWidth) => onToolChange({ strokeWidth })}
            color={tool.color}
          />

          <OpacitySlider
            value={tool.opacity}
            onChange={(opacity) => onToolChange({ opacity })}
          />

          <div className="border-t border-zinc-800 pt-2">
            <UndoRedoControls
              onUndo={onUndo}
              onRedo={onRedo}
              onClear={onClear}
            />
          </div>
        </div>
      )}
    </div>
  )
}
