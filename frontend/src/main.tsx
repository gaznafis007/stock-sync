import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster
      position="top-center"
      gutter={10}
      containerStyle={{ top: 14 }}
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: '14px',
          padding: '12px 14px',
          background: '#182339',
          color: '#eef2ff',
          border: '1px solid #334155',
          boxShadow: '0 18px 34px rgba(12, 19, 35, 0.35)',
          maxWidth: 'min(90vw, 440px)',
        },
        success: {
          duration: 2600,
          iconTheme: { primary: '#22c55e', secondary: '#eef2ff' },
        },
        error: {
          duration: 3400,
          iconTheme: { primary: '#ef4444', secondary: '#eef2ff' },
        },
      }}
    />
    <App />
  </StrictMode>,
)
