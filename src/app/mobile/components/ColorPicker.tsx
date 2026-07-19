import { useState } from 'react'
import { Plus } from 'lucide-react'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

const swatches = [
  '#FFFFFF', '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#09090B',
]

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="flex items-center gap-1.5">
      {swatches.map((swatch) => (
        <button
          key={swatch}
          onClick={() => onChange(swatch)}
          className={`h-7 w-7 cursor-pointer rounded-full border-2 transition-all duration-150 ${
            color === swatch
              ? 'scale-110 border-white shadow-md'
              : 'border-transparent hover:scale-105'
          }`}
          style={{ backgroundColor: swatch }}
          aria-label={`Color ${swatch}`}
        />
      ))}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-zinc-600 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-200"
        aria-label="Custom color"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      {showPicker && (
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent"
          aria-label="Custom color picker"
        />
      )}
    </div>
  )
}
