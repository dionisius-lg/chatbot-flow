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
import { VitePWA } from 'vite-plugin-pwa'

// Use function config to access the current mode (development/production)
export default defineConfig(({ mode }) => {
  // Load environment variables from .env file
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'Chatbot Flow Builder',
          short_name: 'ChatbotFlow',
          description: 'A visual drag-and-drop conversation flow builder Single Page Application.',
          theme_color: '#6366f1',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    server: {
      // Port configured via .env: VITE_APP_PORT
      port: parseInt(env.VITE_APP_PORT || '8082', 10),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Put React Flow/xyflow in a separate chunk
              if (id.includes('@xyflow') || id.includes('reactflow')) {
                return 'vendor-flow';
              }
              // Other node_modules in main vendor chunk
              return 'vendor';
            }
          },
        },
      },
    },
  };
})