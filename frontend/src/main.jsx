import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Sentry initialization removed to avoid dynamic-import/await issues during install/build.
// To re-enable monitoring, add a dedicated Sentry init module and import it at runtime.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
