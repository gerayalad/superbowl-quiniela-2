import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SafariProvider } from './contexts/SafariContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SafariProvider>
      <App />
    </SafariProvider>
  </React.StrictMode>,
)
