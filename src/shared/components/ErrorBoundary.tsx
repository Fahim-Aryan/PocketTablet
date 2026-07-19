import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PocketTablet Error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-zinc-950 p-8 text-center">
          <h1 className="text-xl font-bold text-white">Something went wrong</h1>
          <p className="max-w-md text-sm text-zinc-400">
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="cursor-pointer rounded-xl bg-cta px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-500"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
