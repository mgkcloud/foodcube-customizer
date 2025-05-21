import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/tutorial.css'
import './styles/welcome-modal.css'

// Render the app version with optimized tutorial system
createRoot(document.getElementById("root")!).render(
  <App />
);
