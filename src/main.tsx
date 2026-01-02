import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './user/ui/styles/globals.css'
import './user/ui/styles/components.css'

// Application entry point - Spork AI Platform
createRoot(document.getElementById("root")!).render(<App />);
