import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
import { initTheme } from './platform/theme.ts'
import './styles/global.css'

// Before the first render, so a Day-mode phone does not flash Night colours.
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
