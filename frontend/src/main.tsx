import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Initialize i18n
const stored = localStorage.getItem('i18n-storage')
const lang = stored ? JSON.parse(stored).language || 'fa' : 'fa'
document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
document.documentElement.lang = lang

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

