import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { limpiarCacheCotizacionesLegado } from './services/exchangeRate'

// Una sola vez al iniciar (fuera de React: StrictMode no lo duplica)
limpiarCacheCotizacionesLegado()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
