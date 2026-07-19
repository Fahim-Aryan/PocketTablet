interface OpacitySliderProps {
  value: number
  onChange: (value: number) => void
}

export function OpacitySlider({ value, onChange }: OpacitySliderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-zinc-400">Opacity</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-cta [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
        aria-label="Opacity"
      />
      <span className="w-8 text-right text-xs font-medium text-zinc-400">
        {Math.round(value * 100)}%
      </span>
    </div>
  )
}
