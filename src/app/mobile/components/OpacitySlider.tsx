interface OpacitySliderProps {
  value: number
  onChange: (value: number) => void
}

export function OpacitySlider({ value, onChange }: OpacitySliderProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-6 text-[10px] font-medium text-zinc-500">Alpha</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-cta [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
        aria-label="Opacity"
      />
      <span className="w-7 text-right text-[10px] font-medium tabular-nums text-zinc-500">
        {Math.round(value * 100)}%
      </span>
    </div>
  )
}
