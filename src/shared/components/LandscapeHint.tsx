import { Smartphone } from 'lucide-react'

export function LandscapeHint() {
  return (
    <div className="landscape-hint">
      <div className="landscape-hint-inner">
        <div className="landscape-hint-rotate">
          <Smartphone className="h-16 w-16 text-zinc-600" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-300">Rotate your device</h2>
        <p className="max-w-xs text-sm text-zinc-500">
          PocketTablet works best in landscape mode. Please rotate your phone.
        </p>
      </div>
    </div>
  )
}
