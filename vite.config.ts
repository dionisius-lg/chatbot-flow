// ============================================================================
// Vite Configuration
// ============================================================================
// - React plugin (JSX transform, HMR)
// - Tailwind CSS v4 plugin
// - Dev server port from .env (VITE_APP_PORT), default 5173
// ============================================================================

import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Use function config to access the current mode (development/production)
export default defineConfig(({ mode }) => {
  // Load environment variables from .env file
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      // Port configured via .env: VITE_APP_PORT
      port: parseInt(env.VITE_APP_PORT || '8082', 10),
    },
  };
})