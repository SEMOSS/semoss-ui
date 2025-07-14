import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    const isProduction = mode === 'production';

    const MODULE = env.MODULE;
    const ENDPOINT = env.ENDPOINT;

    return {
        base: './',
        plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
        resolve: {
            alias: [{ find: '@', replacement: resolve(__dirname, './src') }],
        },
        define: {
            'import.meta.env.MODULE': JSON.stringify(MODULE),
        },
        build: {
            minify: isProduction,
            commonjsOptions: { transformMixedEsModules: true },
        },
        server: {
            proxy: {
                [MODULE]: {
                    target: ENDPOINT,
                    changeOrigin: true,
                    secure: false,
                    preserveHeaderKeyCase: true,
                },
            },
        },
        test: {
            environment: 'jsdom',
            globals: true,
            setupFiles: ['./vitest.setup.ts'],
        },
    };
});
