import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/fx-theme.css'
import './styles/fx-base.css'
import './styles/fx-components.css'
import { ThemeProvider } from './core/theme/ThemeContext'
import { SessionProvider } from './core/auth/SessionContext'
import { ToastProvider } from './fx-ui'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SessionProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </SessionProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
