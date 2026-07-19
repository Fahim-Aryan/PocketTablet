import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DesktopPage } from './app/desktop/DesktopPage'
import { MobileConnectPage } from './app/mobile/MobileConnectPage'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { Component, type ReactNode, type ErrorInfo } from 'react'

class CanvasErrorBoundary extends Component<{ children: ReactNode }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Canvas error:', error, info.componentStack)
  }
  render() {
    if (this.state.error) return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center p-8 max-w-md">
          <p className="text-sm text-zinc-500">Canvas error: {this.state.error.message}</p>
        </div>
      </div>
    )
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <CanvasErrorBoundary>
              <DesktopPage />
            </CanvasErrorBoundary>
          } />
          <Route path="/connect" element={<MobileConnectPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App