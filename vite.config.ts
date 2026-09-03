import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
const apiPort = Number(process.env.API_PORT ?? 3001);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Keep web-specific aliases before the broad @ alias so Vite does not
      // resolve the Electron RPC client when bundling the browser app.
      '@/services/rpc-client': resolve(projectRoot, 'src/main-ui/services/rpc-client/web-index.ts'),
      '@/services/rpc-shim-error': resolve(projectRoot, 'src/web/rpc-shim-error-web.ts'),
      '@': resolve(projectRoot, 'src/main-ui'),
      '@shared': resolve(projectRoot, 'src/shared'),
      '@bun': resolve(projectRoot, 'src/bun'),
      electrobun: resolve(projectRoot, 'src/web/electrobun'),
    },
  },
  root: '.',
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});
