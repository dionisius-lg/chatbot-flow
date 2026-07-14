import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default defineConfig((configEnv) => {
    const baseViteConfig = typeof viteConfig === 'function' ? viteConfig(configEnv) : viteConfig;
    return mergeConfig(baseViteConfig, {
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './src/setupTests.ts',
        },
    });
});
