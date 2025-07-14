/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
    base: './',
    plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
    resolve: {
        alias: [{ find: '@', replacement: resolve(__dirname, './src') }],
    },
    build: {
        minify: isProduction,
        commonjsOptions: { transformMixedEsModules: true },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts']
    },
    // test: {
    //     name: 'client',
    //     watch: false,
    //     globals: true,
    //     environment: 'jsdom',
    //     include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    //     deps: {
    //         // Required for vitest-canvas-mock
    //         inline: ['vitest-canvas-mock'],
    //     },
    //     reporters: ['default'],
    //     coverage: {
    //         reportsDirectory: '../../coverage/packages/client',
    //         provider: 'v8',
    //     },
    //     environmentOptions: {
    //         jsdom: {
    //             resources: 'usable',
    //         },
    //     },
    //     cache: {
    //         dir: '../../node_modules/.vitest',
    //     },
    //     setupFiles: ['./vitest.setup.ts'],
    // },
});
