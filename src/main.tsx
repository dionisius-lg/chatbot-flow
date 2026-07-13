import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker automatically
registerSW({ immediate: true });

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
