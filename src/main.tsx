import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#363A4F',
              color: '#CAD3F5',
              border: '1px solid rgba(91, 96, 120, 0.4)',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontFamily: "'Inter', sans-serif",
            },
            success: {
              iconTheme: { primary: '#A6DA95', secondary: '#181926' },
            },
            error: {
              iconTheme: { primary: '#ED8796', secondary: '#181926' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
