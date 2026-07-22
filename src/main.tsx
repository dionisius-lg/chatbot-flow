import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { registerSW } from 'virtual:pwa-register';

import App from './app/App.tsx';

// Register PWA service worker automatically
registerSW({ immediate: true });

createRoot(document.getElementById('app')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
