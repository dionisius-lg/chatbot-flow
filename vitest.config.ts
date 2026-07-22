import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default defineConfig((configEnv) => {
    // Merge base configuration from vite.config.ts so path/alias settings are identical
    const baseViteConfig = typeof viteConfig === 'function' ? viteConfig(configEnv) : viteConfig;

    return mergeConfig(baseViteConfig, {
        test: {
            globals: true, // Allows calling describe/it/expect without manual imports
            environment: 'jsdom', // Simulates a browser DOM environment in Node.js
            setupFiles: './src/setupTests.ts', // This file runs before all tests start
        },
    });
});
