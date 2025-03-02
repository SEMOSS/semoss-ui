/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { resolve } from 'path';

export default defineConfig({
    root: __dirname,
    cacheDir: '../../node_modules/.vite/packages/client',

    plugins: [
        react({ include: /\.(js|jsx|ts|tsx)$/ }),
        nxViteTsPaths(),
        nxCopyAssetsPlugin(['*.md']),
    ],

    resolve: {
        alias: [{ find: '@', replacement: resolve(__dirname, './src') }],
    },
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },

    test: {
        watch: false,
        globals: true,
        environment: 'jsdom',
        include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        deps: {
            // Required for vitest-canvas-mock
            inline: ['vitest-canvas-mock'],
        },
        reporters: ['default'],
        coverage: {
            reportsDirectory: '../../coverage/packages/client',
            provider: 'v8',
        },
        environmentOptions: {
            jsdom: {
                resources: 'usable',
            },
        },
        cache: {
            dir: '../../node_modules/.vitest',
        },
        setupFiles: ['./vitest.setup.ts'],
    },
});
