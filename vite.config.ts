import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

const projectRoot = process.cwd();

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src/main-ui'),
      '@shared': resolve(projectRoot, 'src/shared'),
      '@bun': resolve(projectRoot, 'src/bun'),
      '@/services/rpc-client': resolve(
        projectRoot,
        'src/main-ui/services/rpc-client/web-index.ts',
      ),
      '@/services/rpc-shim-error': resolve(
        projectRoot,
        'src/web/rpc-shim-error-web.ts',
      ),
      electrobun: resolve(projectRoot, 'src/web/electrobun'),
    },
  },
  root: '.',
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
