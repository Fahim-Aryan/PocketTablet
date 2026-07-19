import { useState, useCallback, useRef } from 'react'
import { GripVertical, ChevronDown, ChevronUp, Pipette } from 'lucide-react'
import { ToolSelector } from './ToolSelector'
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

const swatches = [
  '#FFFFFF', '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#09090B',
]

export function FloatingToolbar({
  tool,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
}: FloatingToolbarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [position, setPosition] = useState({ x: 8, y: 8 })
  const [showColorGrid, setShowColorGrid] = useState(false)
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
        x: Math.max(0, Math.min(window.innerWidth - 260, ev.clientX - dragState.current.startX)),
        y: Math.max(0, Math.min(window.innerHeight - 48, ev.clientY - dragState.current.startY)),
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
    <>
      {collapsed ? (
        <div
          className="fixed z-50"
          style={{ left: position.x, top: position.y }}
        >
          <button
            onClick={() => setCollapsed(false)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/90 px-3 py-2 shadow-lg backdrop-blur-xl transition-all hover:border-zinc-500"
          >
            <span
              className="h-3.5 w-3.5 rounded-full border border-zinc-500"
              style={{ backgroundColor: tool.color }}
            />
            <span className="text-xs font-medium text-zinc-300">{tool.strokeWidth}px</span>
            <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        </div>
      ) : (
        <div
          className="fixed z-50 w-[220px] select-none rounded-2xl border border-zinc-700/60 bg-zinc-900/95 shadow-2xl backdrop-blur-2xl"
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
              <GripVertical className="h-3 w-3 text-zinc-600" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                PocketTablet
              </span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="cursor-pointer rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Collapse toolbar"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5 p-3">
            <ToolSelector
              activeTool={tool.tool}
              onSelect={(t: ToolType) => onToolChange({ tool: t })}
            />

            <div className="flex items-center gap-1.5">
              {swatches.slice(0, 5).map((swatch) => (
                <button
                  key={swatch}
                  onClick={() => onToolChange({ color: swatch })}
                  className={`h-6 w-6 cursor-pointer rounded-full border-2 transition-all duration-150 ${
                    tool.color === swatch
                      ? 'scale-110 border-white shadow-md'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Color ${swatch}`}
                />
              ))}
              <button
                onClick={() => setShowColorGrid(!showColorGrid)}
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-600 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-200"
                aria-label="More colors"
              >
                <Pipette className="h-3 w-3" />
              </button>
            </div>

            {showColorGrid && (
              <div className="flex flex-wrap gap-1.5">
                {swatches.slice(5).map((swatch) => (
                  <button
                    key={swatch}
                    onClick={() => { onToolChange({ color: swatch }); setShowColorGrid(false) }}
                    className={`h-6 w-6 cursor-pointer rounded-full border-2 transition-all ${
                      tool.color === swatch ? 'scale-110 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
                <input
                  type="color"
                  value={tool.color}
                  onChange={(e) => onToolChange({ color: e.target.value })}
                  className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent"
                  aria-label="Custom color"
                />
              </div>
            )}

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
        </div>
      )}
    </>
  )
}
