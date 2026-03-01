import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { preloadBundledFonts } from './utils/fontLoader'

// Register bundled fonts (Chopin Script, Papyrus) with FontFace API
// so Canvas 2D can use them for PDF generation.
preloadBundledFonts()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
