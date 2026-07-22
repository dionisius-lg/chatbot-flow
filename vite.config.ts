// ============================================================================
// Vite Configuration
// ============================================================================
// This file is the central configuration for the build process and dev server.
// Vite is used as it provides significantly faster build times compared to Webpack.
// ============================================================================

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// We use the defineConfig(({ mode }) => {...}) syntax
// to dynamically load environment variables (.env) based on the current mode (development/production).
export default defineConfig(({ mode }) => {
    // loadEnv extracts variables from the .env file that are prefixed with VITE_
    const env = loadEnv(mode, process.cwd(), '');
    const basePath = env.VITE_APP_BASE_PATH || '/';
    const baseDir = basePath.endsWith('/') ? basePath : `${basePath}/`;

    return {
        base: baseDir,
        plugins: [
            // Plugin to support React JSX syntax and Fast Refresh
            react(),
            // Plugin to compile Tailwind CSS v4
            tailwindcss(),
            // Progressive Web App (PWA) plugin to allow the app to be installed like a native app
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
                            type: 'image/png',
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                        },
                    ],
                },
            }),
        ],
        server: {
            // Port configured via .env: VITE_APP_PORT
            port: parseInt(env.VITE_APP_PORT || '8082', 10),
        },
        preview: {
            // Port configured via .env: VITE_APP_PORT
            port: parseInt(env.VITE_APP_PORT || '8082', 10),
        },
        build: {
            rollupOptions: {
                output: {
                    // manualChunks splits the final build into separate files (chunks)
                    // to avoid having one giant file. This improves the initial load time of the application.
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            // React Flow graph library is very large, so we separate it into 'vendor-flow'
                            if (id.includes('@xyflow') || id.includes('reactflow')) {
                                return 'vendor-flow';
                            }
                            // Other third-party libraries go into the main 'vendor' chunk
                            return 'vendor';
                        }
                    },
                },
            },
        },
    };
});
