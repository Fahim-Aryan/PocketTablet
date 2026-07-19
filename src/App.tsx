import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DesktopPage } from './app/desktop/DesktopPage'
import { MobileConnectPage } from './app/mobile/MobileConnectPage'
import { ErrorBoundary } from './shared/components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DesktopPage />} />
          <Route path="/connect" element={<MobileConnectPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
