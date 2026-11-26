import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './shared/auth/AuthContext.tsx'
import { AnalyticsTracker } from './shared/analytics/AnalyticsTracker'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AnalyticsTracker />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
