import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'

// Register service worker with update callback
window.__pwaUpdateSW = registerSW({
  onNeedRefresh() {
    // Dispatch event so App.jsx can show the update toast
    window.dispatchEvent(new Event('pwa-update-available'))
  },
  onOfflineReady() {
    console.log('App ready for offline use')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
