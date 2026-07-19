interface StrokeWidthSliderProps {
  value: number
  onChange: (value: number) => void
  color: string
}

export function StrokeWidthSlider({ value, onChange, color }: StrokeWidthSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-zinc-400">Size</span>
      <div className="relative flex flex-1 items-center">
        <input
          type="range"
          min={1}
          max={50}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-cta [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
          aria-label="Stroke width"
        />
        <span
          className="ml-2 flex shrink-0 items-center justify-center rounded-full bg-zinc-800"
          style={{
            width: Math.max(20, Math.min(40, value + 10)),
            height: Math.max(20, Math.min(40, value + 10)),
          }}
        >
          <span
            className="rounded-full"
            style={{
              width: Math.max(4, value * 0.6),
              height: Math.max(4, value * 0.6),
              backgroundColor: color,
            }}
          />
        </span>
      </div>
    </div>
  )
}
