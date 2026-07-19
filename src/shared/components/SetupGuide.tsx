import { Settings, Globe, Key, Wifi } from 'lucide-react'

export function SetupGuide() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <h2 className="mb-1 text-lg font-bold text-white">PocketTablet</h2>
        <p className="mb-6 text-sm text-zinc-400">
          Supabase Realtime needs to be configured for cross-device drawing.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
              <Globe className="h-4 w-4 text-zinc-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">1. Create a Supabase project</p>
              <p className="text-xs text-zinc-500">
                Go to{' '}
                <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-cta underline">
                  supabase.com
                </a>{' '}
                and create a new project (free tier works).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
              <Key className="h-4 w-4 text-zinc-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">2. Get your API credentials</p>
              <p className="text-xs text-zinc-500">
                In your Supabase dashboard, go to <strong>Project Settings → API</strong>. Copy the <strong>Project URL</strong> and the <strong>anon public key</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
              <Wifi className="h-4 w-4 text-zinc-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">3. Enable Realtime</p>
              <p className="text-xs text-zinc-500">
                In your Supabase dashboard, go to <strong>Realtime</strong> and toggle <strong>"Enable Realtime"</strong> on.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
              <Settings className="h-4 w-4 text-zinc-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">4. Set environment variables</p>
              <p className="text-xs text-zinc-500">
                In Vercel dashboard, add these env vars:
              </p>
              <pre className="mt-1 rounded-lg bg-zinc-950 p-2 text-xs text-zinc-400">
                VITE_SUPABASE_URL=https://your-project.supabase.co{'\n'}
                VITE_SUPABASE_ANON_KEY=your-anon-key
              </pre>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          After adding the env vars, redeploy from{' '}
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-cta underline">
            Vercel dashboard
          </a>.
        </p>
      </div>
    </div>
  )
}
