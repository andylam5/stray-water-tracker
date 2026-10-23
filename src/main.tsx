import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { readDemoFlag } from './lib/demo'
import { migrateStorage } from './lib/storage'

migrateStorage()
readDemoFlag()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
