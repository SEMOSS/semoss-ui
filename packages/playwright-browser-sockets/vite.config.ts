import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      'process.env.MODULE': JSON.stringify(env.MODULE),
      'process.env.ENDPOINT': JSON.stringify(env.ENDPOINT),
      'process.env.APP': JSON.stringify(env.APP),
    },
    server: {
      port: 5174,
      proxy: {
        [env.MODULE || '/Monolith']: {
          target: env.ENDPOINT || 'http://localhost:9090/',
          changeOrigin: true,
          secure: false,
          preserveHeaderKeyCase: true,
          ws: true,
        },
      },
    },
  };
});
