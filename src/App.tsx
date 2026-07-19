import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DesktopPage } from './app/desktop/DesktopPage'
import { MobileConnectPage } from './app/mobile/MobileConnectPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DesktopPage />} />
        <Route path="/connect" element={<MobileConnectPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
