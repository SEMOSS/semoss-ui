// /// <reference types="vitest" />
// import { defineConfig } from 'vitest/config';
// import react from '@vitejs/plugin-react';
// import { resolve } from 'node:path';

// const isProduction = process.env.NODE_ENV === 'production';

// export default defineConfig({
//     base: './',
//     plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
//     resolve: {
//         alias: [
//             { find: '@', replacement: resolve(__dirname, './src') },
//             { find: 'vega-embed', replacement: 'vega-embed/build/vega-embed.js' },
//         ],
//     },
//     build: {
//         minify: isProduction,
//         commonjsOptions: { transformMixedEsModules: true },
//     },
//     test: {
//         environment: 'jsdom',
//         globals: true,
//         setupFiles: ['./vitest.setup.ts']
        
//     },
// });

// libs/renderer/vitest.config.ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Force single thread to avoid ESM issues
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Exclude problematic modules from transformation
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/vega*/**',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // More aggressive aliasing
      'vega-embed': resolve(__dirname, './src/__mocks__/vega-embed.js'),
      'vega': resolve(__dirname, './src/__mocks__/vega.js'),
      'vega-lite': resolve(__dirname, './src/__mocks__/vega-lite.js'),
    },
  },
  define: {
    global: 'globalThis',
  },
})

