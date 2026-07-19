interface StrokeWidthSliderProps {
  value: number
  onChange: (value: number) => void
  color: string
}

export function StrokeWidthSlider({ value, onChange, color }: StrokeWidthSliderProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-6 text-[10px] font-medium text-zinc-500">Size</span>
      <div className="relative flex flex-1 items-center gap-2">
        <input
          type="range"
          min={1}
          max={50}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-cta [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
          aria-label="Stroke width"
        />
        <span
          className="flex shrink-0 items-center justify-center rounded-full bg-zinc-800"
          style={{
            width: Math.max(16, Math.min(28, value * 0.4 + 8)),
            height: Math.max(16, Math.min(28, value * 0.4 + 8)),
          }}
        >
          <span
            className="rounded-full"
            style={{
              width: Math.max(3, Math.min(16, value * 0.35)),
              height: Math.max(3, Math.min(16, value * 0.35)),
              backgroundColor: color,
            }}
          />
        </span>
      </div>
    </div>
  )
}
